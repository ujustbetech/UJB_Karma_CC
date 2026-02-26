'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/firebaseConfig';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/utility_collection';

import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/ToastProvider';

import FormField from '@/components/ui/FormField';
import Select from '@/components/ui/Select';
import { User, UserPlus } from 'lucide-react';

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

  /* ---------------- Load Users ---------------- */
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userRef = collection(db, COLLECTIONS.userDetail);
        const snapshot = await getDocs(userRef);

        const users = snapshot.docs.map((doc) => ({
          ujbCode: doc.id,
          name: doc.data()['Name'] || '',
          phone: doc.data().MobileNo || '',
        }));

        setUserList(users);
      } catch (err) {
        toast.error('Failed to load users');
      }
    };

    fetchUsers();
  }, []);

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSearchUser = (value) => {
    setUserSearch(value);
    clearError('name');

    const filtered = userList.filter((u) =>
      u.name?.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {
    setName(user.name);
    setPhone(user.phone);
    setUserSearch('');
    setFilteredUsers([]);
    clearError('name');
  };

  const handleInterestChange = (key, checked) => {
    setInterests((prev) => ({ ...prev, [key]: checked }));
  };

  const validate = () => {
    const newErrors = {};

    if (!name) newErrors.name = 'User is required';
    if (!phone) newErrors.phone = 'Phone missing';
    if (!type) newErrors.type = 'Type required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendWhatsAppMessage = async (userPhone, eventId) => {
    const url = `https://graph.facebook.com/v21.0/527476310441806/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: `91${userPhone}`,
      type: 'template',
      template: {
        name: 'register_mm',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: `https://uspacex.vercel.app/events/${eventId}`,
              },
            ],
          },
        ],
      },
    };

    await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'YOUR_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
        type,
        registeredAt: new Date(),
      });

      await sendWhatsAppMessage(phone, eventId);

      toast.success('User registered & message sent');

      router.push(`/admin/event/RegisteredUser/${eventId}`);
    } catch (err) {
      toast.error('Failed to register user');
    }

    setLoading(false);
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      
      <div className="flex items-center gap-3">
        <UserPlus className="w-5 h-5 text-blue-600" />
        <Text as="h2">Add User to Event</Text>
        {/* <Text className="text-sm text-gray-500">
          Search and register members for this monthly meeting
        </Text> */}
      </div>

      <div className="space-y-5">

        {/* Search User */}
        <FormField label="Search Member" error={errors.name} required>
          <div className="relative">
            <Input
              value={userSearch}
              onChange={(e) => handleSearchUser(e.target.value)}
              placeholder="Type member name"
              error={!!errors.name}
              autoFocus
            />

            {filteredUsers.length > 0 && (
              <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <div
                    key={u.phone}
                    onClick={() => handleSelectUser(u)}
                    className="px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition"
                  >
                    <div className="text-sm font-medium text-slate-800">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {u.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FormField>

        {/* Selected Member */}
        <FormField label="Selected Member" required>
          <div className="grid grid-cols-2 gap-4">
            <Input value={name} readOnly error={!!errors.name} />
            <Input value={phone} readOnly error={!!errors.phone} />
          </div>
        </FormField>

        {/* Interests (Chip Style) */}
        <FormField label="Interested In">
          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                handleInterestChange(
                  'knowledgeSharing',
                  !interests.knowledgeSharing
                )
              }
              className={`px-3 py-1.5 rounded-full text-sm border ${interests.knowledgeSharing
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-white border-gray-300'
                }`}
            >
              Knowledge Sharing
            </button>

            <button
              type="button"
              onClick={() =>
                handleInterestChange('e2a', !interests.e2a)
              }
              className={`px-3 py-1.5 rounded-full text-sm border ${interests.e2a
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-white border-gray-300'
                }`}
            >
              E2A
            </button>

            <button
              type="button"
              onClick={() =>
                handleInterestChange('oneToOne', !interests.oneToOne)
              }
              className={`px-3 py-1.5 rounded-full text-sm border ${interests.oneToOne
                ? 'bg-purple-100 text-purple-700 border-purple-200'
                : 'bg-white border-gray-300'
                }`}
            >
              1:1
            </button>

            <button
              type="button"
              onClick={() =>
                handleInterestChange('none', !interests.none)
              }
              className={`px-3 py-1.5 rounded-full text-sm border ${interests.none
                ? 'bg-gray-100 text-gray-700 border-gray-200'
                : 'bg-white border-gray-300'
                }`}
            >
              None
            </button>

          </div>
        </FormField>

        {/* Type */}
        <FormField label="Type" error={errors.type} required>
          <Select
            value={type}
            onChange={(val) => {
              setType(val);
              clearError('type');
            }}
            error={!!errors.type}
            options={[
              { label: 'Select Type', value: '' },
              { label: 'Type A', value: 'A' },
              { label: 'Type B', value: 'B' },
              { label: 'Type C', value: 'C' },
            ]}
          />

        </FormField>

        {/* CTA */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Registering…' : 'Register & Send'}
          </Button>
        </div>

      </div>
    </Card>
  );
}
