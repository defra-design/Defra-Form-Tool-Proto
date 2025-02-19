// app/routes.js
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const path = require('path')
const fs = require('fs')

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    body: req.body
  })
  next()
})

// Add no-cache headers to all responses
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  next()
})

// JSON Viewer
router.get('/json-viewer', (req, res) => {
  res.render('json-viewer')
})

// Redirect root to pages list
router.get('/', (req, res) => {
  res.redirect('/pages')
})

// Pages list
router.get('/pages', (req, res) => {
  res.render('pages')
})

// Field types list
router.get('/field-types', (req, res) => {
  res.render('field-types', {
    params: {
      pageId: req.query.pageId
    }
  })
})

// Question editor - new
router.get('/question-editor/new/:type', (req, res) => {
  const pageId = req.query.pageId;
  const fieldType = req.params.type;
  const questionId = `form_${Date.now()}`;

  if (!pageId) {
    res.redirect('/pages');
    return;
  }

  res.render('question-editor', {
    data: {
      id: questionId,
      pageId: pageId,
      fieldType: fieldType,
      isNew: true
    },
    params: {
      type: fieldType,
      id: questionId,
      pageId: pageId,
      returnUrl: `/page-editor/${pageId}`
    }
  });
});

// Question editor - edit existing
router.get('/question-editor/:type/:id', (req, res) => {
  const questionId = req.params.id;
  const pageId = req.query.pageId;
  
  console.log('Loading question editor with:', {
    questionId,
    pageId,
    type: req.params.type
  });

  // Load the page data from localStorage
  let pageData;
  try {
    // Access localStorage through req.app.locals
    const store = req.app.locals.prototypeKit.sessionDataStore;
    console.log('Available store keys:', Object.keys(store.data));
    
    const rawPageData = store.data[pageId];
    console.log('Raw page data:', rawPageData);
    
    pageData = rawPageData ? JSON.parse(rawPageData) : null;
    console.log('Parsed page data:', pageData);
  } catch (e) {
    console.error('Error loading page data:', e);
    pageData = null;
  }

  // Find the question in the page's questions array
  let questionData = null;
  if (pageData && pageData.questions) {
    questionData = pageData.questions.find(q => q.id === questionId);
    console.log('Found question data:', questionData);
  }

  const templateData = {
    data: questionData || {}, // Pass the question data to the template
    params: {
      id: req.params.id,
      type: req.params.type,
      pageId: req.query.pageId,
      returnUrl: `/page-editor/${req.query.pageId}`
    }
  };
  
  console.log('Rendering template with data:', templateData);

  res.render('question-editor', templateData);
});

// Save question
router.post('/question-editor/:id/save', (req, res) => {
  const questionId = req.params.id;
  const pageId = req.body.pageId;

  try {
    // Load existing page data
    const rawPageData = localStorage.getItem(pageId);
    let pageData = rawPageData ? JSON.parse(rawPageData) : { id: pageId, questions: [] };

    // Find the question index in the array
    const questionIndex = pageData.questions.findIndex(q => q.id === questionId);

    // Create the updated question data
    const questionData = {
      id: questionId,
      pageId: pageId,
      fieldType: req.body.fieldType,
      title: req.body.title,
      hint: req.body.hint,
      maxLength: req.body.maxLength,
      pattern: req.body.pattern,
      min: req.body.min,
      max: req.body.max,
      accept: req.body.accept,
      maxSize: req.body.maxSize
    };

    // Update or add the question
    if (questionIndex !== -1) {
      pageData.questions[questionIndex] = questionData;
    } else {
      pageData.questions.push(questionData);
    }

    // Save the updated page data
    localStorage.setItem(pageId, JSON.stringify(pageData));

    console.log('Saved question data:', questionData);
  } catch (e) {
    console.error('Error saving question:', e);
  }

  res.redirect(req.body.returnUrl || `/page-editor/${req.body.pageId}`);
});

// Option editor - new
router.get('/option-editor/:type', (req, res) => {
  const questionId = req.query.questionId;
  const pageId = req.query.pageId;
  const returnUrl = req.query.returnUrl;
  const fieldType = req.params.type;

  if (!questionId || !pageId) {
    res.redirect('/pages');
    return;
  }

  res.render('option-editor', {
    data: {
      id: `option_${Date.now()}`,
      questionId: questionId,
      pageId: pageId,
      fieldType: fieldType,
      isNew: true
    },
    params: {
      fieldType: fieldType,
      pageId: pageId,
      returnUrl: returnUrl || `/question-editor/${fieldType}/${questionId}?pageId=${pageId}`
    }
  });
});

// Option editor - edit existing
router.get('/option-editor/:type/:id', (req, res) => {
  const questionId = req.query.questionId;
  const pageId = req.query.pageId;
  const returnUrl = req.query.returnUrl;
  const fieldType = req.params.type;
  const optionId = req.params.id;

  if (!questionId || !pageId) {
    res.redirect('/pages');
    return;
  }

  res.render('option-editor', {
    data: {
      id: optionId,
      questionId: questionId,
      pageId: pageId,
      fieldType: fieldType,
      isNew: false
    },
    params: {
      fieldType: fieldType,
      pageId: pageId,
      returnUrl: returnUrl || `/question-editor/${fieldType}/${questionId}?pageId=${pageId}`
    }
  });
});

// Save option (redirect back to question editor)
router.post('/option-editor/:id/save', (req, res) => {
  // Get the form data
  const optionData = {
    id: req.params.id,
    text: req.body.text,
    hint: req.body.hint,
    value: req.body.value
  };

  // Get existing question data from localStorage
  const questionData = req.session.data[req.body.questionId] || {};
  questionData.options = questionData.options || [];

  // Find and update existing option or add new one
  const existingIndex = questionData.options.findIndex(opt => opt.id === optionData.id);
  if (existingIndex >= 0) {
    questionData.options[existingIndex] = optionData;
  } else {
    questionData.options.push(optionData);
  }

  // Save back to session
  req.session.data[req.body.questionId] = questionData;

  // Redirect back
  res.redirect(req.body.returnUrl || `/question-editor/${req.body.fieldType}/${req.body.questionId}?pageId=${req.body.pageId}`);
});

// Page editor
router.get('/page-editor/:pageId', (req, res) => {
  res.render('page-editor', {
    params: {
      pageId: req.params.pageId
    }
  })
})

// Page create
router.get('/page-create', (req, res) => {
  res.render('page-create')
})

// Form preview
router.get('/form-preview', (req, res) => {
  res.render('form-preview')
})

// Question preview
router.post('/preview', (req, res) => {
  res.render('includes/_question-preview', {
    data: {
      title: req.body.title,
      hint: req.body.hint,
      fieldType: req.body.fieldType,
      options: req.body.options || []
    }
  })
})

// Save new page (just redirect to editor)
router.post('/page-create/save', (req, res) => {
  if (!req.body.title || req.body.title.trim() === '') {
    res.redirect('/pages');
    return;
  }

  const pageId = `page_${Date.now()}`;
  const title = req.body.title.trim();
  
  // Create initial page data
  const pageData = {
    id: pageId,
    title: title,
    questions: []
  };
  
  // Save directly to localStorage via a client-side script
  res.send(`
    <script>
      localStorage.setItem('${pageId}', JSON.stringify(${JSON.stringify(pageData)}));
      window.location.href = '/page-editor/${pageId}?title=${encodeURIComponent(title)}';
    </script>
  `);
})

// Lists API - read from JSON file
router.get('/api/lists', (req, res) => {
  try {
    const listsPath = path.join(__dirname, 'data', 'lists.json')
    console.log('Loading lists from:', listsPath)
    
    if (!fs.existsSync(listsPath)) {
      console.error('Lists file not found at:', listsPath)
      res.status(404).json({ error: 'Lists file not found' })
      return
    }
    
    const listsData = JSON.parse(fs.readFileSync(listsPath, 'utf8'))
    console.log('Successfully loaded lists data')
    res.json(listsData)
  } catch (error) {
    console.error('Error loading lists:', error)
    res.status(500).json({ error: 'Failed to load lists: ' + error.message })
  }
})

module.exports = router