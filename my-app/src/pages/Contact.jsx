import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { showToast } from '../utils/toastUtils';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      showToast.success('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 3000);
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Contact Us</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
            <h2 className="text-xl font-semibold text-white mb-6">Get in Touch</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zocc-blue-600/30 rounded-lg">
                  <Mail className="text-zocc-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Email</h3>
                  <p className="text-zocc-blue-300 text-sm">support@zocc.kluniversity.in</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zocc-blue-600/30 rounded-lg">
                  <Phone className="text-zocc-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Phone</h3>
                  <p className="text-zocc-blue-300 text-sm">+91 9876543210</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zocc-blue-600/30 rounded-lg">
                  <MapPin className="text-zocc-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Address</h3>
                  <p className="text-zocc-blue-300 text-sm">
                    KL University<br />
                    Vaddeswaram, Guntur<br />
                    Andhra Pradesh
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
            {submitted ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                <h2 className="text-2xl font-semibold text-white mb-2">Message Sent!</h2>
                <p className="text-zocc-blue-300">We'll get back to you soon.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-white mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send size={20} />
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

