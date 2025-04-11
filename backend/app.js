const propertyRoutes = require('./routes/propertyRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/feedback', feedbackRoutes); 