import { useState } from 'react';
import { Upload, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

const Submissions = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const submissions = [
    {
      id: 1,
      session: 'React Advanced Patterns',
      date: '2024-01-10',
      status: 'reviewed',
      feedback: 'Great work! Well-structured code.',
      thumbnail: null
    },
    {
      id: 2,
      session: 'Database Design',
      date: '2024-01-08',
      status: 'accepted',
      feedback: 'Excellent implementation. Approved!',
      thumbnail: null
    },
    {
      id: 3,
      session: 'API Development',
      date: '2024-01-05',
      status: 'pending',
      feedback: null,
      thumbnail: null
    },
    {
      id: 4,
      session: 'Git Workflow',
      date: '2024-01-03',
      status: 'reviewed',
      feedback: 'Good progress. Keep it up!',
      thumbnail: null
    },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert('Only JPG and PNG files are allowed');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    // TODO: Integrate with MinIO backend
    console.log('Uploading file:', selectedFile);
    setUploadModalOpen(false);
    setSelectedFile(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'reviewed':
        return <Eye className="text-blue-400" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-400" size={20} />;
      default:
        return <XCircle className="text-red-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'reviewed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">My Submissions</h1>
          <p className="text-zocc-blue-300">Track and manage your session outputs</p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all shadow-lg shadow-zocc-blue-500/25 hover:shadow-xl hover:shadow-zocc-blue-500/40"
        >
          <Upload size={20} />
          Upload Output
        </button>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <div key={submission.id} className="dashboard-card group cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-zocc-blue-600/20">
                {getStatusIcon(submission.status)}
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                {submission.status.toUpperCase()}
              </span>
            </div>

            {submission.thumbnail && (
              <div className="mb-4 rounded-lg overflow-hidden bg-zocc-blue-800/30">
                <img src={submission.thumbnail} alt="Submission" className="w-full h-32 object-cover" />
              </div>
            )}

            <h3 className="text-white font-semibold mb-2 group-hover:text-zocc-blue-300 transition-colors">
              {submission.session}
            </h3>
            <p className="text-sm text-zocc-blue-400 mb-4">{submission.date}</p>

            {submission.feedback && (
              <div className="bg-zocc-blue-800/30 rounded-lg p-3 border border-zocc-blue-700/30">
                <p className="text-sm text-zocc-blue-200">{submission.feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Upload Submission</h3>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-zocc-blue-300 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Select Image (JPG/PNG, Max 2MB)
                </label>
                <div className="border-2 border-dashed border-zocc-blue-600 rounded-lg p-6 text-center hover:border-zocc-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input" className="cursor-pointer">
                    <Upload className="mx-auto mb-2 text-zocc-blue-400" size={32} />
                    <p className="text-zocc-blue-300 text-sm">
                      {selectedFile ? selectedFile.name : 'Click to browse or drag and drop'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Session
                </label>
                <select className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500">
                  <option>Select a session</option>
                  <option>React Advanced Patterns</option>
                  <option>Database Design</option>
                  <option>API Development</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[100px]"
                  placeholder="Add any additional notes..."
                ></textarea>
              </div>

              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="w-full px-4 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Upload Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Submissions;

