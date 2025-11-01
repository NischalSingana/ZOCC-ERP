import { useState } from 'react';
import { FolderKanban, Users, Plus, XCircle } from 'lucide-react';

const Projects = () => {
  const [proposeModalOpen, setProposeModalOpen] = useState(false);

  const projects = [
    {
      id: 1,
      title: 'AI Chatbot Integration',
      mentor: 'Dr. Sarah Lee',
      status: 'active',
      teamSize: 4,
      maxTeamSize: 6,
      description: 'Build an intelligent chatbot using NLP and machine learning',
      tech: ['Python', 'TensorFlow', 'FastAPI'],
      progress: 65
    },
    {
      id: 2,
      title: 'E-Commerce Platform',
      mentor: 'Prof. Mike Johnson',
      status: 'active',
      teamSize: 5,
      maxTeamSize: 5,
      description: 'Full-stack e-commerce solution with payment integration',
      tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      progress: 80
    },
    {
      id: 3,
      title: 'Blockchain Voting System',
      mentor: 'Dr. Alex Brown',
      status: 'planning',
      teamSize: 0,
      maxTeamSize: 4,
      description: 'Secure voting system using blockchain technology',
      tech: ['Solidity', 'Web3', 'React'],
      progress: 0
    },
    {
      id: 4,
      title: 'Mobile Health App',
      mentor: 'Prof. Emily Chen',
      status: 'active',
      teamSize: 3,
      maxTeamSize: 5,
      description: 'Health tracking app with AI-powered insights',
      tech: ['Flutter', 'Firebase', 'TensorFlow Lite'],
      progress: 45
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'planning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Club Projects</h1>
          <p className="text-zocc-blue-300">Explore and join exciting coding projects</p>
        </div>
        <button
          onClick={() => setProposeModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all shadow-lg shadow-zocc-blue-500/25"
        >
          <Plus size={20} />
          Propose Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="dashboard-card group cursor-pointer hover:scale-[1.02] transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700">
                  <FolderKanban className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-semibold group-hover:text-zocc-blue-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-zocc-blue-400">{project.mentor}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                {project.status.toUpperCase()}
              </span>
            </div>

            <p className="text-zocc-blue-300 mb-4 text-sm">{project.description}</p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tech.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-zocc-blue-800/50 rounded-full text-xs text-zocc-blue-300 border border-zocc-blue-700/50"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Team & Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zocc-blue-300">
                  <Users size={16} />
                  <span>{project.teamSize}/{project.maxTeamSize} members</span>
                </div>
                {project.status === 'active' && (
                  <button className="text-zocc-blue-400 hover:text-white text-sm font-medium transition-colors">
                    View Details →
                  </button>
                )}
              </div>

              {project.status === 'active' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zocc-blue-300">Progress</span>
                    <span className="text-sm font-medium text-white">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-zocc-blue-800/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-zocc-blue-500 to-zocc-blue-400 transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {project.status === 'planning' && (
                <button className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all font-medium">
                  Join Project
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Propose Project Modal */}
      {proposeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-zocc-blue-900 to-zocc-blue-800 rounded-xl border border-zocc-blue-700/50 p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Propose New Project</h3>
              <button
                onClick={() => setProposeModalOpen(false)}
                className="text-zocc-blue-300 hover:text-white"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                  Description *
                </label>
                <textarea
                  className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500 min-h-[120px]"
                  placeholder="Describe your project idea..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                    Technologies
                  </label>
                  <input
                    type="text"
                    className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    className="w-full bg-zocc-blue-800/50 border border-zocc-blue-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setProposeModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-zocc-blue-800 text-white rounded-lg hover:bg-zocc-blue-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all font-medium">
                  Submit Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

