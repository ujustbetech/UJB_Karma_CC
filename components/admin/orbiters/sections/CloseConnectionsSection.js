'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TagsInput from '@/components/ui/TagsInput';
import Button from '@/components/ui/Button';

import { Users, Plus, Trash2 } from 'lucide-react';

export default function CloseConnectionsSection({ profile }) {
  const { formData, setFormData } = profile;

  const connections = Array.isArray(formData.closeConnections)
    ? formData.closeConnections
    : [];

  const relationshipOptions = [
    { label: 'Select', value: '' },
    { label: 'Friend', value: 'Friend' },
    { label: 'Family', value: 'Family' },
    { label: 'Client', value: 'Client' },
    { label: 'Business Partner', value: 'Business Partner' },
    { label: 'Vendor', value: 'Vendor' },
    { label: 'Mentor', value: 'Mentor' },
    { label: 'Investor', value: 'Investor' },
    { label: 'Employee', value: 'Employee' },
    { label: 'Colleague', value: 'Colleague' },
    { label: 'Other', value: 'Other' },
  ];

  const updateConnection = (index, field, value) => {
    const updated = [...connections];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setFormData({ ...formData, closeConnections: updated });
  };

  const addConnection = () => {
    const updated = [
      ...connections,
      {
        name: '',
        phone: '',
        profession: '',
        relationship: '',
        skills: [],
        notes: '',
      },
    ];
    setFormData({ ...formData, closeConnections: updated });
  };

  const removeConnection = (index) => {
    const updated = connections.filter((_, i) => i !== index);
    setFormData({ ...formData, closeConnections: updated });
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Text variant="h3" className="flex items-center gap-2">
          <Users size={18} />
          Close Connections
        </Text>

        <Text variant="muted">
          {connections.length} added
        </Text>
      </div>

      <Text variant="muted" className="mt-1">
        Strong networks increase trust & referrals
      </Text>

      <div className="space-y-4 mt-5">
        {connections.map((conn, index) => (
          <Card key={index} className="bg-slate-50">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Name" required>
                <Input
                  value={conn.name || ''}
                  onChange={(e) =>
                    updateConnection(index, 'name', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Contact Number" required>
                <Input
                  value={conn.phone || ''}
                  onChange={(e) =>
                    updateConnection(index, 'phone', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Profession">
                <Input
                  value={conn.profession || ''}
                  onChange={(e) =>
                    updateConnection(index, 'profession', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Relationship">
                <Select
                  value={conn.relationship || ''}
                  options={relationshipOptions}
                  onChange={(val) =>
                    updateConnection(index, 'relationship', val)
                  }
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Skills">
                <TagsInput
                  value={Array.isArray(conn.skills) ? conn.skills : []}
                  onChange={(vals) =>
                    updateConnection(index, 'skills', vals)
                  }
                  placeholder="Type skill & press Enter"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="Notes / Other Information">
                <Input
                  value={conn.notes || ''}
                  onChange={(e) =>
                    updateConnection(index, 'notes', e.target.value)
                  }
                />
              </FormField>
            </div>

            <div className="flex justify-end mt-3">
              <Button
                variant="ghost"
                onClick={() => removeConnection(index)}
                className="flex items-center gap-1"
              >
                <Trash2 size={14} />
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={addConnection}
          className="flex items-center gap-2"
        >
          <Plus size={14} />
          Add Connection
        </Button>
      </div>
    </Card>
  );
}
