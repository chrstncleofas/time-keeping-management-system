'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Shield,
  Save,
  Camera,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';

interface UserProfile {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  employeeId: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  mobileNumber?: string;
  sss?: string;
  philhealth?: string;
  pagibig?: string;
  tin?: string;
  photoUrl?: string;
  leaveCredits: number;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user, token, isHydrated } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    mobileNumber: '',
    birthday: '',
    gender: 'male' as 'male' | 'female' | 'other',
    sss: '',
    philhealth: '',
    pagibig: '',
    tin: '',
  });

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [isHydrated, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user?._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setFormData({
          mobileNumber: data.user.mobileNumber || '',
          birthday: data.user.birthday ? format(new Date(data.user.birthday), 'yyyy-MM-dd') : '',
          gender: data.user.gender || 'male',
          sss: data.user.sss || '',
          philhealth: data.user.philhealth || '',
          pagibig: data.user.pagibig || '',
          tin: data.user.tin || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const response = await fetch(`/api/users/${user?._id}/upload-photo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ photoBase64: base64String }),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success('Profile photo updated successfully!');
          setProfile((prev) => prev ? { ...prev, photoUrl: data.photoUrl } : null);
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to upload photo');
        }
        setUploadingPhoto(false);
      };

      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploadingPhoto(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/users/${user?._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setEditing(false);
        fetchProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserIcon className="w-8 h-8 text-primary-600" />
          My Profile
        </h1>
        <p className="text-gray-600 mt-2">View and manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        {/* Header with Photo */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-primary-700 font-bold text-3xl">
                  {profile.firstName[0]}{profile.lastName[0]}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 bg-white text-primary-600 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <div className="animate-spin w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {profile.firstName} {profile.middleName ? `${profile.middleName[0]}. ` : ''}{profile.lastName}
              </h2>
              <p className="text-primary-100 mt-1">{profile.employeeId}</p>
              <div className="mt-2 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-sm">
                <Shield className="w-4 h-4" />
                {profile.role === 'admin' ? 'Administrator' : 'Employee'}
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Information */}
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Basic Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Mobile Number
              </label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                disabled={!editing}
                placeholder="+63 9XX XXX XXXX"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                disabled={!editing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-2" />
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                disabled={!editing}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Government IDs */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Government IDs
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                SSS Number
              </label>
              <input
                type="text"
                value={formData.sss}
                onChange={(e) => setFormData({ ...formData, sss: e.target.value })}
                disabled={!editing}
                placeholder="XX-XXXXXXX-X"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                PhilHealth Number
              </label>
              <input
                type="text"
                value={formData.philhealth}
                onChange={(e) => setFormData({ ...formData, philhealth: e.target.value })}
                disabled={!editing}
                placeholder="XX-XXXXXXXXX-X"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Pag-IBIG Number
              </label>
              <input
                type="text"
                value={formData.pagibig}
                onChange={(e) => setFormData({ ...formData, pagibig: e.target.value })}
                disabled={!editing}
                placeholder="XXXX-XXXX-XXXX"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                TIN Number
              </label>
              <input
                type="text"
                value={formData.tin}
                onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                disabled={!editing}
                placeholder="XXX-XXX-XXX-XXX"
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${
                  editing ? 'bg-white' : 'bg-gray-50 text-gray-600'
                }`}
              />
            </div>

            {/* Account Information */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Account Information
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Credits Remaining
              </label>
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-primary-50 text-primary-700 font-semibold">
                {profile.leaveCredits} days
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Member Since
              </label>
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {format(new Date(profile.createdAt), 'MMMM dd, yyyy')}
              </div>
            </div>
          </div>

          {/* Actions */}
          {editing && (
            <div className="mt-8 pt-6 border-t flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  fetchProfile();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
