'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  db,
} from '@/services/adminMonthlyMeetingFirebaseService';
import { COLLECTIONS } from '@/lib/utility_collection';

import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

import FormField from '@/components/ui/FormField';
import Select from '@/components/ui/Select';
import { UserPlus } from 'lucide-react';
import { sendWhatsAppTemplateRequest } from '@/utils/whatsappClient';

export default function AddUserSection({ eventId: propEventId }) {
  const router = useRouter();
  const toast = useToast();

  const eventId = propEventId;

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');

  const [userList, setUserList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  const [interests, setInterests] = useState({
    knowledgeSharing: false,
    e2a: false,
    oneToOne: false,
    none: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userRef = collection(db, COLLECTIONS.userDetail);
        const snapshot = await getDocs(userRef);

        const users = snapshot.docs.map((item) => ({
          ujbCode: item.id,
          name: item.data().Name || '',
          phone: item.data().MobileNo || '',
        }));

        setUserList(users);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, [toast]);

  const clearError = (field) => {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSearchUser = (value) => {
    setUserSearch(value);
    clearError('name');

    const filtered = userList.filter((user) =>
      user.name?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setName(user.name);
    setPhone(user.phone);
    setUserSearch('');
    setFilteredUsers([]);
    clearError('name');
    clearError('phone');
  };

  const handleInterestChange = (key, checked) => {
    setInterests((previous) => ({ ...previous, [key]: checked }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!name) nextErrors.name = 'User is required';
    if (!phone) nextErrors.phone = 'Phone missing';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const sendWhatsAppMessage = async (userPhone, currentEventId) => {
    await sendWhatsAppTemplateRequest({
      phone: userPhone,
      templateName: 'register_mm',
      parameters: [`https://uspacex.vercel.app/events/${currentEventId}`],
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!eventId) {
      toast.error('Event ID missing');
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(
        db,
        `${COLLECTIONS.monthlyMeeting}/${eventId}/registeredUsers/${phone}`
      );

      await setDoc(userRef, {
        name,
        phone,
        interestedIn: interests,
        type: type || '',
        registeredAt: new Date(),
      });

      await sendWhatsAppMessage(phone, eventId);

      toast.success('User registered and message sent');
      router.push(`/admin/monthlymeeting/${eventId}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <UserPlus className="h-5 w-5 text-blue-600" />
        <Text as="h2">Add User to Event</Text>
      </div>

      <div className="space-y-5">
        <FormField label="Search Member" error={errors.name} required>
          <div className="relative">
            <Input
              value={userSearch}
              onChange={(event) => handleSearchUser(event.target.value)}
              placeholder="Type member name"
              error={!!errors.name}
              autoFocus
            />

            {filteredUsers.length > 0 && (
              <div className="absolute z-30 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredUsers.map((user) => (
                  <div
                    key={user.phone}
                    onClick={() => handleSelectUser(user)}
                    className="cursor-pointer px-4 py-2.5 transition hover:bg-blue-50"
                  >
                    <div className="text-sm font-medium text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>

        <FormField label="Selected Member" required>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input value={name} readOnly error={!!errors.name} />
            <Input value={phone} readOnly error={!!errors.phone} />
          </div>
        </FormField>

        <FormField label="Interested In">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                handleInterestChange('knowledgeSharing', !interests.knowledgeSharing)
              }
              className={`rounded-full border px-3 py-1.5 text-sm ${
                interests.knowledgeSharing
                  ? 'border-green-200 bg-green-100 text-green-700'
                  : 'border-gray-300 bg-white'
              }`}
            >
              Knowledge Sharing
            </button>

            <button
              type="button"
              onClick={() => handleInterestChange('e2a', !interests.e2a)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                interests.e2a
                  ? 'border-blue-200 bg-blue-100 text-blue-700'
                  : 'border-gray-300 bg-white'
              }`}
            >
              E2A
            </button>

            <button
              type="button"
              onClick={() => handleInterestChange('oneToOne', !interests.oneToOne)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                interests.oneToOne
                  ? 'border-purple-200 bg-purple-100 text-purple-700'
                  : 'border-gray-300 bg-white'
              }`}
            >
              1:1
            </button>

            <button
              type="button"
              onClick={() => handleInterestChange('none', !interests.none)}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                interests.none
                  ? 'border-gray-200 bg-gray-100 text-gray-700'
                  : 'border-gray-300 bg-white'
              }`}
            >
              None
            </button>
          </div>
        </FormField>

        <FormField label="Type (Optional)">
          <Select
            value={type}
            onChange={(value) => {
              setType(value);
              clearError('type');
            }}
            options={[
              { label: 'Select Type', value: '' },
              { label: 'Member', value: 'member' },
              { label: 'Guest', value: 'guest' },
              { label: 'Speaker', value: 'speaker' },
            ]}
          />
        </FormField>

        <div className="flex justify-end border-t pt-4">
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Registering...' : 'Register & Send'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
