import { useRef, useState } from 'react';
import { Upload, X, File } from 'lucide-react';

const FileUpload = ({
  onFileSelect,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 20, // in MB
  label,
  error,
  currentFile,
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
          {label}
        </label>
      )}
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive
            ? 'border-zocc-blue-500 bg-zocc-blue-500/10'
            : 'border-zocc-blue-700/30 hover:border-zocc-blue-500/50'
          } ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {selectedFile || currentFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File size={24} className="text-zocc-blue-400" />
              <div>
                <p className="text-white font-medium">
                  {selectedFile?.name || currentFile}
                </p>
                {selectedFile && (
                  <p className="text-sm text-zocc-blue-300">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
            {!disabled && (
              <button
                onClick={removeFile}
                className="p-2 rounded-lg hover:bg-zocc-blue-800 transition-colors text-zocc-blue-300 hover:text-red-400"
              >
                <X size={20} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload size={32} className="mx-auto text-zocc-blue-400 mb-2" />
            <p className="text-zocc-blue-300 mb-1">
              Drag and drop a file here, or{' '}
              <button
                onClick={() => !disabled && fileInputRef.current?.click()}
                className="text-zocc-blue-400 hover:text-zocc-blue-300 underline"
                disabled={disabled}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-zocc-blue-400">
              {accept === 'image/png,image/jpeg,image/jpg'
                ? `Max size: ${maxSize}MB. Accepted: PNG, JPG, JPEG only`
                : `Max size: ${maxSize}MB. Accepted: Images, PDF, DOC, DOCX`}
            </p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default FileUpload;

