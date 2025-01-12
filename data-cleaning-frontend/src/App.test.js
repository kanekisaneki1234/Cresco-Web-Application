import { act } from 'react';
import axios from 'axios';
import { FileParsingService, DataCleaningService, DataInfoService, DataVisualizationService } from './UploadFile';
import HTMLDataHandler from './HTMLData';
import DocumentDataHandler from './DocumentTable';

// Mock axios
jest.mock('axios');

describe('Error Handling Tests', () => {
  // Mock functions
  const mockSetLoading = jest.fn();
  const mockSetError = jest.fn();
  const mockSetTableData = jest.fn();
  const mockSetColumns = jest.fn();
  const mockSetSelectedFile = jest.fn();
  const mockSetResponseData = jest.fn();
  const mockSetInfoData = jest.fn();
  const mockSetVisData = jest.fn();
  const mockSetHTMLData = jest.fn();
  const mockSetDocumentData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FileParsingService Tests', () => {
    test('should handle file size error', async () => {
      const largeFile = new File([''], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(largeFile, 'size', { value: 150 * 1024 * 1024 }); // 150MB

      await act(async () => {
        await FileParsingService.handleFileChange(
          largeFile,
          mockSetSelectedFile,
          mockSetTableData,
          mockSetColumns,
          mockSetError
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'FILE_SIZE_ERROR',
        message: 'File too large',
        details: expect.stringContaining('Maximum file size is 100MB')
      });
    });

    test('should handle invalid file type error', async () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        await FileParsingService.handleFileChange(
          invalidFile,
          mockSetSelectedFile,
          mockSetTableData,
          mockSetColumns,
          mockSetError
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'FILE_TYPE_ERROR',
        message: 'Invalid file type',
        details: 'Only CSV files are supported'
      });
    });
  });

  describe('DataCleaningService Tests', () => {
    test('should handle network error', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const cleaningOptions = { method: 'dropna' };

      axios.post.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await DataCleaningService.handleCleaningSubmit(
          file,
          cleaningOptions,
          mockSetResponseData,
          mockSetLoading,
          mockSetError
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'NETWORK_ERROR',
        message: 'Failed to upload file',
        details: 'Network error'
      });
      expect(mockSetLoading).toHaveBeenCalledTimes(2);
    });
  });

  describe('DataInfoService Tests', () => {
    test('should handle API error response', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      
      axios.post.mockRejectedValue({
        response: {
          data: {
            error: {
              type: 'NETWORK_ERROR',
              message: 'Failed to upload file',
              details: 'Invalid data format'
            }
          }
        }
      });

      await act(async () => {
        await DataInfoService.handleInfoSubmit(
          file,
          mockSetInfoData,
          mockSetLoading,
          mockSetError
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'NETWORK_ERROR',
        message: 'Failed to upload file',
        details: 'Invalid data format'
      });
    });
  });

  describe('DataVisualizationService Tests', () => {
    test('should handle missing response data', async () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      const visualizationOptions = { method: 'both' };

      // Simulate throwing an error with the expected structure
      axios.post.mockRejectedValue({
        response: {
          data: {
            error: {
              type: 'NETWORK_ERROR',
              message: 'Failed to upload file',
              details: JSON.stringify({
                type: 'RESPONSE_ERROR',
                message: 'Invalid response format',
                details: 'Response data is missing'
              })
            }
          }
        }
      });

      await act(async () => {
        await DataVisualizationService.handleVisualizationSubmit(
          file,
          visualizationOptions,
          mockSetVisData,
          mockSetLoading,
          mockSetError
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'NETWORK_ERROR',
        message: 'Failed to upload file',
        details: expect.stringContaining('Response data is missing')
      });
    });
  });

  describe('HTMLDataHandler Tests', () => {
    test('should handle JSON parse error', async () => {
      const url = 'http://example.com';
      
      axios.post.mockResolvedValue({
        data: {
          data: 'invalid-json'
        }
      });

      await act(async () => {
        await HTMLDataHandler.fetchHTMLData(
          { preventDefault: jest.fn() },
          url,
          mockSetLoading,
          mockSetError,
          mockSetHTMLData
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'PARSE_ERROR',
        message: 'Failed to parse response data',
        details: expect.any(String)
      });
    });

    test('should handle empty URL error', async () => {
      const url = '';

      axios.post.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await HTMLDataHandler.fetchHTMLData(
          { preventDefault: jest.fn() },
          url,
          mockSetLoading,
          mockSetError,
          mockSetHTMLData
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'NETWORK_ERROR',
        message: expect.stringContaining('Failed to upload url'),
        details: expect.any(String)
      });
    });
  });

  describe('DocumentDataHandler Tests', () => {
    test('should handle invalid document format', async () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });

      axios.post.mockResolvedValue({
        data: {
          Status: 'error',
          Error: {
            type: 'DOCUMENT_ERROR',
            message: 'Invalid document format'
          }
        }
      });

      await act(async () => {
        await DocumentDataHandler.handleDocumentSubmit(
          file,
          mockSetDocumentData,
          mockSetError,
          mockSetLoading
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'DOCUMENT_ERROR',
        message: 'Invalid document format'
      });
    });

    test('should handle document parsing error', async () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });

      axios.post.mockResolvedValue({
        data: {
          data: 'invalid-json'
        }
      });

      await act(async () => {
        await DocumentDataHandler.handleDocumentSubmit(
          file,
          mockSetDocumentData,
          mockSetError,
          mockSetLoading
        );
      });

      expect(mockSetError).toHaveBeenCalledWith({
        type: 'PARSE_ERROR',
        message: 'Failed to parse response data',
        details: expect.any(String)
      });
    });
  });
});