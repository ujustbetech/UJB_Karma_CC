'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TagsInput from '@/components/ui/TagsInput';
import Button from '@/components/ui/Button';

import {
  User,
  ShieldCheck,
  MapPin,
  Globe,
  BriefcaseBusiness,
  FileUser,
} from 'lucide-react';

const toPreferredCommunicationTags = (val) => {
  if (Array.isArray(val)) return val.map((t) => String(t || '').trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
};

export default function PersonalInfoSection({ profile }) {
  /* 🛡️ SAFE PROFILE + FORMDATA */
  const safeProfile = profile || {};
  const {
    formData = {},
    setFormData = () => { },
    residentStatus = '',
    taxSlab = '',
    handleResidentChange = () => { },
    profilePreview = '',
    handleProfilePhotoChange = () => { }
  } = safeProfile;

  /* 🛡️ SAFE CLEAN */
  const clean = (v) => {
    if (!v || v === '—') return '';
    return typeof v === 'string' ? v.trim() : v;
  };


  const handlePincodeChange = async (pin) => {
    handleChange('Pincode', pin);

    if (pin.length !== 6) return;

    try {
      const res = await fetch(
        `https://api.postalpincode.in/pincode/${pin}`
      );
      const data = await res.json();

      const post = data?.[0]?.PostOffice?.[0];

      if (post) {
        setFormData(prev => ({
          ...prev,
          Pincode: pin,
          City: post.District,
          State: post.State
        }));
      }
    } catch (err) {
      console.log("Pincode lookup failed");
    }
  };


  /* 🛡️ SAFE SOCIAL LINKS */
  const links = Array.isArray(formData?.BusinessSocialMediaPages)
    ? formData.BusinessSocialMediaPages
    : [{ platform: '', url: '', customPlatform: '' }];

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  /* ---------------- SOCIAL HANDLERS ---------------- */

  const updateSocial = (index, key, value) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, BusinessSocialMediaPages: updated });
  };

  const addSocial = () => {
    setFormData({
      ...formData,
      BusinessSocialMediaPages: [
        ...links,
        { platform: '', url: '', customPlatform: '' }
      ]
    });
  };

  const removeSocial = (index) => {
    const updated = links.filter((_, i) => i !== index);
    setFormData({ ...formData, BusinessSocialMediaPages: updated });
  };

  const socialPlatforms = [
    'Facebook',
    'Instagram',
    'LinkedIn',
    'YouTube',
    'Twitter',
    'Pinterest',
    'Other'
  ];

  return (
    <Card>
      <div className="flex items-center gap-2">
        <FileUser size={18} />
        <Text variant="h3">Personal Information</Text>
      </div>

      <Text variant="muted">
        GST, Shop Act, PAN, Cheque, Address Proof
      </Text>

      {/* ================= IDENTITY ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-4">
        <User size={18} /> Identity
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <FormField label="Name">
          <Input value={clean(formData?.Name)} disabled />
        </FormField>

        <FormField label="Category">
          <Select
            value={formData?.Category || ""}
            onChange={(value) => handleChange('Category', value)}
            options={[
              { value: "", label: "Select" },
              { value: "Orbiter", label: "Orbiter" },
              { value: "CosmOrbiter", label: "CosmOrbiter" },
            ]}
          />
        </FormField>

        <FormField label="Email">
          <Input value={clean(formData?.Email)} disabled />
        </FormField>

        <FormField label="Mobile">
          <Input value={clean(formData?.MobileNo || formData?.Mobile)} disabled />
        </FormField>

        <FormField label="Resident Status">
          <Select
            value={residentStatus || ""}
            onChange={(value) => handleResidentChange(value)}
            options={[
              { value: "", label: "Select" },
              { value: "Resident", label: "Resident" },
              { value: "Non-Resident", label: "Non-Resident" },
            ]}
          />
        </FormField>

        <FormField label="Applicable Tax Slab">
          <Input value={clean(taxSlab)} disabled />
        </FormField>

        <FormField label="Date of Birth">
          <Input
            value={clean(formData?.DOB)}
            onChange={(e) => handleChange('DOB', e.target.value)}
            placeholder="DD/MM/YYYY or as registered"
          />
        </FormField>

        <FormField label="Preferred Communication" className="col-span-2">
          <TagsInput
            value={toPreferredCommunicationTags(formData?.PreferredCommunication)}
            onChange={(tags) => handleChange('PreferredCommunication', tags)}
            placeholder='Add channels (same as Prospect feedback: "Whatsapp", "Email", "Phone call"); press Enter'
          />
        </FormField>
      </div>

      {/* ================= VERIFICATION ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <ShieldCheck size={18} /> Verification
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <FormField label="Profile Photo">
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleProfilePhotoChange(e.target.files[0])}
            />
            {profilePreview && (
              <img
                src={profilePreview}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
          </div>
        </FormField>

        <FormField label="ID Type">
          <Select
            value={formData?.IDType || ""}
            onChange={(value) => handleChange('IDType', value)}
            options={[
              { value: "", label: "Select" },
              { value: "Aadhaar", label: "Aadhaar" },
              { value: "PAN", label: "PAN" },
              { value: "Passport", label: "Passport" },
              { value: "Driving License", label: "Driving License" },
            ]}
          />
        </FormField>

        <FormField label="ID Number">
          <Input
            value={clean(formData?.IDNumber)}
            onChange={(e) => handleChange('IDNumber', e.target.value)}
          />
        </FormField>
      </div>

      {/* ================= LOCATION ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <MapPin size={18} /> Location
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-2">

        <FormField label="Country">
          <Input
            value={clean(formData?.Country)}
            onChange={(e) => handleChange('Country', e.target.value)}
            placeholder="Country"
          />
        </FormField>

        <FormField label="Pincode">
          <Input
            value={formData?.Pincode || ""}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="Enter 6-digit PIN"
          />
        </FormField>

        <FormField label="City">
          <Input
            value={clean(formData?.City)}
            onChange={(e) => handleChange('City', e.target.value)}
          />
        </FormField>

        <FormField label="State">
          <Input
            value={clean(formData?.State)}
            onChange={(e) => handleChange('State', e.target.value)}
          />
        </FormField>

        <FormField label="Location">
          <Input
            value={clean(formData?.Location)}
            onChange={(e) => handleChange('Location', e.target.value)}
          />
        </FormField>
      </div>

      {/* Prospect / assessment aligned work fields (stored on profile; mirrored in Professional for some types) */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <BriefcaseBusiness size={18} /> Company & sector
      </Text>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <FormField label="Company">
          <Input
            value={clean(formData?.CompanyName ?? formData?.Company)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                CompanyName: e.target.value,
                Company: e.target.value,
              }))}
            placeholder="Company or business name"
          />
        </FormField>

        <FormField label="Industry">
          <Input
            value={clean(formData?.Industry)}
            onChange={(e) => handleChange('Industry', e.target.value)}
            placeholder="Industry"
          />
        </FormField>
      </div>

      {/* ================= SOCIAL MEDIA ================= */}
      <Text variant="h4" className="flex items-center gap-2 mt-8">
        <Globe size={18} /> Social Media
      </Text>

      <div className="space-y-4 mt-2">
        {links.map((link, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 items-center">
            <Select
              value={link?.platform || ""}
              onChange={(value) => updateSocial(index, 'platform', value)}
              options={[
                { value: "", label: "Platform" },
                ...socialPlatforms.map(p => ({ value: p, label: p }))
              ]}
            />

            {link?.platform === 'Other' && (
              <Input
                placeholder="Custom Platform"
                value={clean(link?.customPlatform)}
                onChange={(e) =>
                  updateSocial(index, 'customPlatform', e.target.value)
                }
              />
            )}

            <Input
              placeholder="URL"
              value={clean(link?.url)}
              onChange={(e) => updateSocial(index, 'url', e.target.value)}
            />

            {links.length > 1 && (
              <Button variant="ghost" onClick={() => removeSocial(index)}>
                Remove
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" onClick={addSocial}>
          + Add Social Link
        </Button>
      </div>
    </Card>
  );
}

