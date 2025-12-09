import { useState, useEffect } from 'react';
import { Eye, EyeOff, Upload } from 'lucide-react';
import FileUpload from './FileUpload';
import axiosInstance from '../api/axiosConfig';
import { showToast } from '../utils/toastUtils';
import { useAuth } from '../context/AuthContext';

const ProfileForm = ({ user, onUpdate }) => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    studentFullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [photo, setPhoto] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        studentFullName: user.studentFullName || '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (file) => {
    setPhoto(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile
      const updateData = {
        studentFullName: formData.studentFullName,
        email: formData.email,
        phone: formData.phone,
      };

      const response = await axiosInstance.put('/api/users/me', updateData);

      if (response.data?.user) {
        updateUser(response.data.user);
        showToast.success('Profile updated successfully!');
        onUpdate?.(response.data.user);
      }

      // Upload photo if selected
      if (photo) {
        try {
          const formDataPhoto = new FormData();
          formDataPhoto.append('photo', photo);
          const photoResponse = await axiosInstance.post('/api/users/me/photo', formDataPhoto, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (photoResponse.data?.user) {
            updateUser(photoResponse.data.user);
            showToast.success('Profile photo updated successfully!');
          }
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to upload photo';
          showToast.error(errorMessage);
        }
      }

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          showToast.error('New passwords do not match');
          setLoading(false);
          return;
        }

        if (!formData.currentPassword) {
          showToast.error('Current password is required to change password');
          setLoading(false);
          return;
        }

        try {
          await axiosInstance.put('/api/users/me/password', {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          });
          showToast.success('Password updated successfully!');

          // Clear password fields
          setFormData({
            ...formData,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to update password';
          showToast.error(errorMessage);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
          Profile Photo
        </label>
        <FileUpload
          onFileSelect={handlePhotoChange}
          accept="image/png,image/jpeg,image/jpg"
          maxSize={5}
          currentFile={user?.photo}
        />
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          name="studentFullName"
          value={formData.studentFullName}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
          required
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
          Email
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

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
          Phone
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
        />
      </div>

      {/* Password Section */}
      <div className="border-t border-zocc-blue-700/30 pt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zocc-blue-400 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zocc-blue-400 hover:text-white"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white placeholder-zocc-blue-400 focus:outline-none focus:ring-2 focus:ring-zocc-blue-500"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zocc-blue-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-700 text-white font-semibold rounded-lg hover:from-zocc-blue-700 hover:to-zocc-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ProfileForm;

