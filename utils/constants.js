const unexpectedErrorMessage = 'An unexpected error occurred. Please try again later.';
const excludedFieldsOfQueryingDB = ['page', 'sort', 'limit', 'fields']; 
const comparisonOperatorsRegex = /\b(gte|gt|lte|lt)\b/g; // Regular expression to match comparison operators in query string


module.exports = {
  unexpectedErrorMessage,
  excludedFieldsOfQueryingDB,
  comparisonOperatorsRegex
};