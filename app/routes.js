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
  res.render('question-editor', {
    params: {
      id: req.params.id,
      type: req.params.type,
      pageId: req.query.pageId,
      returnUrl: `/page-editor/${req.query.pageId}`
    }
  })
})

// Save question (just redirect back to page editor)
router.post('/question-editor/:id/save', (req, res) => {
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

// Form preview
router.get('/form-preview', (req, res) => {
  res.render('form-preview')
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