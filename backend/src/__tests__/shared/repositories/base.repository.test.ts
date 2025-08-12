import { BaseRepository } from '../../../shared/repositories/base.repository';
import { Document, Model } from 'mongoose';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Create a mock model with proper jest function mocks
const createMockModel = () => {
  const mockModel: any = {
    modelName: 'TestModel',
    save: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    exists: jest.fn(),
    aggregate: jest.fn(),
  };

  // Ensure all methods return jest mocks with proper typing
  Object.keys(mockModel).forEach((key: string) => {
    if (key !== 'modelName' && typeof mockModel[key] === 'function') {
      mockModel[key] = jest.fn();
    }
  });

  return mockModel as unknown as Model<any>;
};

// Create a concrete implementation for testing
class TestRepository extends BaseRepository<any> {
  constructor(model: Model<any>) {
    super(model);
  }
}

describe('Base Repository', () => {
  let repository: TestRepository;
  let mockModel: any;

  beforeEach(() => {
    mockModel = createMockModel();
    repository = new TestRepository(mockModel as Model<any>);
    jest.clearAllMocks();
  });

  describe('Find By ID', () => {
    it('should find document by ID successfully', async () => {
      const mockDocument = { _id: '123', name: 'Test' };
      mockModel.findById.mockResolvedValue(mockDocument);

      const result = await repository.findById('123');

      expect(result).toEqual(mockDocument);
      expect(mockModel.findById).toHaveBeenCalledWith('123', undefined);
    });

    it('should find document by ID with projection', async () => {
      const mockDocument = { _id: '123', name: 'Test' };
      const projection = { name: 1 };
      mockModel.findById.mockResolvedValue(mockDocument);

      const result = await repository.findById('123', projection);

      expect(result).toEqual(mockDocument);
      expect(mockModel.findById).toHaveBeenCalledWith('123', projection);
    });

    it('should handle find by ID errors', async () => {
      const mockError = new Error('Find failed');
      mockModel.findById.mockRejectedValue(mockError);

      await expect(repository.findById('123')).rejects.toThrow('Find failed');
    });
  });

  describe('Find', () => {
    it('should find documents successfully', async () => {
      const mockDocuments = [
        { _id: '123', name: 'Test1' },
        { _id: '456', name: 'Test2' },
      ];
      mockModel.find.mockResolvedValue(mockDocuments);

      const result = await repository.find({ name: 'Test' });

      expect(result).toEqual(mockDocuments);
      expect(mockModel.find).toHaveBeenCalledWith({ name: 'Test' }, undefined, undefined);
    });

    it('should find documents with projection and options', async () => {
      const mockDocuments = [{ _id: '123', name: 'Test' }];
      const projection = { name: 1 };
      const options = { sort: { name: 1 } };
      mockModel.find.mockResolvedValue(mockDocuments);

      const result = await repository.find({ name: 'Test' }, projection, options);

      expect(result).toEqual(mockDocuments);
      expect(mockModel.find).toHaveBeenCalledWith({ name: 'Test' }, projection, options);
    });

    it('should handle find errors', async () => {
      const mockError = new Error('Find failed');
      mockModel.find.mockRejectedValue(mockError);

      await expect(repository.find({ name: 'Test' })).rejects.toThrow('Find failed');
    });
  });

  describe('Find One', () => {
    it('should find one document successfully', async () => {
      const mockDocument = { _id: '123', name: 'Test' };
      mockModel.findOne.mockResolvedValue(mockDocument);

      const result = await repository.findOne({ name: 'Test' });

      expect(result).toEqual(mockDocument);
      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test' }, undefined, undefined);
    });

    it('should handle find one errors', async () => {
      const mockError = new Error('Find one failed');
      mockModel.findOne.mockRejectedValue(mockError);

      await expect(repository.findOne({ name: 'Test' })).rejects.toThrow('Find one failed');
    });
  });

  describe('Update By ID', () => {
    it('should update document by ID successfully', async () => {
      const mockDocument = { _id: '123', name: 'Updated' };
      const update = { name: 'Updated' };
      mockModel.findByIdAndUpdate.mockResolvedValue(mockDocument);

      const result = await repository.updateById('123', update);

      expect(result).toEqual(mockDocument);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('123', update, { new: true });
    });

    it('should handle update by ID errors', async () => {
      const mockError = new Error('Update failed');
      mockModel.findByIdAndUpdate.mockRejectedValue(mockError);

      await expect(repository.updateById('123', { name: 'Updated' })).rejects.toThrow('Update failed');
    });
  });

  describe('Update Many', () => {
    it('should update many documents successfully', async () => {
      const mockResult = { modifiedCount: 2 };
      const filter = { status: 'active' };
      const update = { status: 'inactive' };
      mockModel.updateMany.mockResolvedValue(mockResult);

      const result = await repository.updateMany(filter, update);

      expect(result).toEqual(mockResult);
      expect(mockModel.updateMany).toHaveBeenCalledWith(filter, update, undefined);
    });

    it('should handle update many errors', async () => {
      const mockError = new Error('Update many failed');
      mockModel.updateMany.mockRejectedValue(mockError);

      await expect(repository.updateMany({ status: 'active' }, { status: 'inactive' })).rejects.toThrow('Update many failed');
    });
  });

  describe('Delete By ID', () => {
    it('should delete document by ID successfully', async () => {
      const mockDocument = { _id: '123', name: 'Test' };
      mockModel.findByIdAndDelete.mockResolvedValue(mockDocument);

      const result = await repository.deleteById('123');

      expect(result).toEqual(mockDocument);
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('123');
    });

    it('should handle delete by ID errors', async () => {
      const mockError = new Error('Delete failed');
      mockModel.findByIdAndDelete.mockRejectedValue(mockError);

      await expect(repository.deleteById('123')).rejects.toThrow('Delete failed');
    });
  });

  describe('Delete Many', () => {
    it('should delete many documents successfully', async () => {
      const mockResult = { deletedCount: 2 };
      const filter = { status: 'inactive' };
      mockModel.deleteMany.mockResolvedValue(mockResult);

      const result = await repository.deleteMany(filter);

      expect(result).toEqual(mockResult);
      expect(mockModel.deleteMany).toHaveBeenCalledWith(filter);
    });

    it('should handle delete many errors', async () => {
      const mockError = new Error('Delete many failed');
      mockModel.deleteMany.mockRejectedValue(mockError);

      await expect(repository.deleteMany({ status: 'inactive' })).rejects.toThrow('Delete many failed');
    });
  });

  describe('Count', () => {
    it('should count documents successfully', async () => {
      mockModel.countDocuments.mockResolvedValue(5);

      const result = await repository.count({ status: 'active' });

      expect(result).toBe(5);
      expect(mockModel.countDocuments).toHaveBeenCalledWith({ status: 'active' });
    });

    it('should handle count errors', async () => {
      const mockError = new Error('Count failed');
      mockModel.countDocuments.mockRejectedValue(mockError);

      await expect(repository.count({ status: 'active' })).rejects.toThrow('Count failed');
    });
  });

  describe('Exists', () => {
    it('should check existence successfully when document exists', async () => {
      mockModel.exists.mockResolvedValue({ _id: '123' });

      const result = await repository.exists({ email: 'test@example.com' });

      expect(result).toBe(true);
      expect(mockModel.exists).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should check existence successfully when document does not exist', async () => {
      mockModel.exists.mockResolvedValue(null);

      const result = await repository.exists({ email: 'nonexistent@example.com' });

      expect(result).toBe(false);
      expect(mockModel.exists).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    it('should handle exists errors', async () => {
      const mockError = new Error('Exists check failed');
      mockModel.exists.mockRejectedValue(mockError);

      await expect(repository.exists({ email: 'test@example.com' })).rejects.toThrow('Exists check failed');
    });
  });

  describe('Aggregate', () => {
    it('should perform aggregation successfully', async () => {
      const mockResults = [{ _id: 'active', count: 5 }];
      const pipeline = [{ $match: { status: 'active' } }, { $group: { _id: '$status', count: { $sum: 1 } } }];
      mockModel.aggregate.mockResolvedValue(mockResults);

      const result = await repository.aggregate(pipeline);

      expect(result).toEqual(mockResults);
      expect(mockModel.aggregate).toHaveBeenCalledWith(pipeline);
    });

    it('should handle aggregation errors', async () => {
      const mockError = new Error('Aggregation failed');
      const pipeline = [{ $match: { status: 'active' } }];
      mockModel.aggregate.mockRejectedValue(mockError);

      await expect(repository.aggregate(pipeline)).rejects.toThrow('Aggregation failed');
    });
  });
});
