import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { User, Mail, Phone, GraduationCap, Edit, Save, X, Key } from 'lucide-react';
import { showToast } from '../../utils/toastUtils';

const StudentDetails = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({
    id: '',
    idNumber: '',
    studentFullName: '',
    email: '',
    phone: '',
    photo: '',
    role: 'STUDENT',
    emailVerified: false,
  });

  useEffect(() => {
    if (studentId) {
      fetchStudentDetails(studentId);
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchStudentDetails = async (id) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/users/${id}`);
      if (response.data?.success && response.data?.user) {
        const userData = response.data.user;
        setStudentData({
          id: userData.id || userData._id,
          idNumber: userData.idNumber || '',
          studentFullName: userData.studentFullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          photo: userData.photo || '',
          role: userData.role || 'STUDENT',
          emailVerified: userData.emailVerified || false,
        });
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
      showToast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // API call to update student
      const response = await axiosInstance.put(`/api/users/${studentData.id}`, {
        studentFullName: studentData.studentFullName,
        email: studentData.email,
        phone: studentData.phone,
        idNumber: studentData.idNumber,
      });

      if (response.data?.success || response.data?.user) {
        showToast.success('Student details updated successfully');
        // Refetch the student data to ensure we have the latest
        await fetchStudentDetails(studentData.id);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      showToast.error('Failed to update student details');
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Are you sure you want to reset this student\'s password? They will need to use forgot password to set a new one.')) {
      return;
    }

    try {
      // API call to reset password
      await axiosInstance.post(`/api/admin/students/${studentData.id}/reset-password`);
      showToast.success('Password reset email sent to student');
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast.error('Failed to reset password');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white">Loading student details...</div>
      </div>
    );
  }

  if (!studentData.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-white mb-4">No student selected</p>
          <p className="text-zocc-blue-300 text-sm">
            Select a student from the Registered Students page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Student Details</h1>

      <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-6 border border-zocc-blue-700/30">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Student Information</h2>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Save size={18} />
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-zocc-blue-800/50 text-white rounded-lg hover:bg-zocc-blue-700/50 flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 flex items-center gap-2"
              >
                <Edit size={18} />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Profile Photo */}
        <div className="mb-6 flex justify-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-zocc-blue-600 to-zocc-blue-700 flex items-center justify-center text-5xl font-bold text-white overflow-hidden ring-4 ring-zocc-blue-500/30">
              {(studentData.studentFullName || studentData.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2 flex items-center gap-2">
              <GraduationCap size={16} />
              ID Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={studentData.idNumber}
                onChange={(e) => setStudentData({ ...studentData, idNumber: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
              />
            ) : (
              <p className="text-white">{studentData.idNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2 flex items-center gap-2">
              <User size={16} />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={studentData.studentFullName}
                onChange={(e) => setStudentData({ ...studentData, studentFullName: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
              />
            ) : (
              <p className="text-white">{studentData.studentFullName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2 flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={studentData.email}
                onChange={(e) => setStudentData({ ...studentData, email: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
              />
            ) : (
              <p className="text-white">{studentData.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zocc-blue-300 mb-2 flex items-center gap-2">
              <Phone size={16} />
              Phone
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={studentData.phone}
                onChange={(e) => setStudentData({ ...studentData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-zocc-blue-800/50 border border-zocc-blue-700/30 rounded-lg text-white"
              />
            ) : (
              <p className="text-white">{studentData.phone || 'Not provided'}</p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zocc-blue-700/30">
          <button
            onClick={handleResetPassword}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Key size={18} />
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;

