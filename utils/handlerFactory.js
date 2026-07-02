const ApiFeatures = require('./ApiFeatures');
const AppError = require('./AppError');
const catchAsync = require('./catchAsync');

exports.deleteOne = (Model, ModelName) =>
  catchAsync(async (req, res, next) => {
    const { user } = req;
    const userId = user._id;
    const userRole = user.role;

    const { id } = req.params;

    // Get the document first
    const document = await Model.findById(id);

    if (!document) {
      return next(
        new AppError(`No ${ModelName || 'document'} found with id: ${id}`, 404),
      );
    }

    // Allow delete only if owner or admin
    const isOwner = document.user._id?.toString() === userId.toString();

    if (!isOwner && userRole !== 'admin') {
      return next(
        new AppError(
          `You are not allowed to delete this ${ModelName || 'document'}, as it not yours`,
          403,
        ),
      );
    }

    await Model.findByIdAndDelete(id);

    res.status(200).json({
      status: 'success',
    });
  });

exports.updateOne = (Model, ModelName) =>
  catchAsync(async (req, res, next) => {
    const { user } = req;
    const userId = user._id;
    const userRole = user.role;

    const documentNameLowercase = ModelName
      ? ModelName.toLowerCase()
      : 'document';

    const { id } = req.params;
    const { body } = req;

    // Get the document first
    const document = await Model.findById(id);

    if (!document) {
      return next(
        new AppError(`No ${ModelName || 'document'} found with id: ${id}`, 404),
      );
    }

    // Allow update only if owner or admin
    const isOwner = document.user._id?.toString() === userId.toString();

    if (!isOwner && userRole !== 'admin') {
      return next(
        new AppError(
          `You are not allowed to update this ${ModelName || 'document'}, as it not yours`,
          403,
        ),
      );
    }

    const updatedDocument = await Model.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        [documentNameLowercase]: updatedDocument,
        insertionId: updatedDocument._id,
      },
    });
  });

exports.createOne = (Model, ModelName) =>
  catchAsync(async (req, res, next) => {
    const documentNameLowercase = ModelName
      ? ModelName.toLowerCase()
      : 'document';
    const newDocument = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        [documentNameLowercase]: newDocument,
        insertionId: newDocument._id,
      },
    });
  });

exports.getOne = (Model, ModelName, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const documentNameLowercase = ModelName
      ? ModelName.toLowerCase()
      : 'document';
    const { id } = req.params;
    let query = Model.findById(id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    if (!doc) {
      return next(
        new AppError(`No ${ModelName || 'document'} found with id: ${id}`, 404),
      );
    }
    res.status(200).json({
      status: 'success',
      data: {
        [documentNameLowercase]: doc,
      },
    });
  });

exports.getAll = (
  Model,
  ModelName,
  populateOptions,
  featuresObject = {},
  nestedField = null,
) =>
  catchAsync(async (req, res, next) => {
    const documentNameLowercase = ModelName
      ? `${ModelName.toLowerCase()}s`
      : 'documents';

    // to allow for nested GET reviews on tour dynamic nestedField = tour
    let filter = {};
    if (nestedField && req.params[`${nestedField}Id`]) {
      filter = { [nestedField]: req.params[`${nestedField}Id`] };
    }

    let mainQuery = Model.find(filter);
    if (populateOptions) mainQuery = mainQuery.populate(populateOptions);

    const features = new ApiFeatures(mainQuery, req.query, Model);

    if (featuresObject.filter) features.filter();
    if (featuresObject.sort) features.sort();
    if (featuresObject.limitFields) features.limitFields();
    if (featuresObject.paginate) await features.paginate();
    if (featuresObject === '*') {
      features.filter();
      features.sort();
      await features.paginate();
      features.limitFields();
    }

    // const documents = await features.query.explain()
    const documents = await features.query;

    res.status(200).json({
      status: 'success',
      requestedAt: req.requestedTime,
      results: documents.length,
      page: featuresObject.paginate ? req.query.page * 1 || 1 : undefined,
      data: {
        [documentNameLowercase]: documents,
      },
    });
  });
