'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TagsInput from '@/components/ui/TagsInput';
import Button from '@/components/ui/Button';
import CommercialModelEditor from '@/components/admin/orbiters/CommercialModelEditor';
import { createDefaultCommercialModel } from '@/utils/commercialModel';

import {
  Briefcase,
  PlusCircle,
  DollarSign,
  Target,
  Award,
  Image as ImageIcon,
  IndianRupee
} from 'lucide-react';

export default function ServicesSection({ profile }) {
  const {
    formData,
    setFormData,
    serviceImagesTemp,
    handleServiceImagesChange,
    removeServiceImage
  } = profile;

  const services = formData?.services || [];

  const getSavedImages = (service) =>
    Array.isArray(service?.images)
      ? service.images.filter((image) => image?.url)
      : service?.imageURL
        ? [{ url: service.imageURL, name: service.name || "service-image" }]
        : [];

  /* ---------------- HELPERS ---------------- */

  const normalizeTags = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string')
      return v.split(',').map(t => t.trim()).filter(Boolean);
    return [];
  };

  const activeCount = services.filter(s => s?.isVisible !== false).length;

  const updateService = (i, key, value) => {
    const updated = [...services];
    updated[i] = { ...updated[i], [key]: value };
    setFormData({ ...formData, services: updated });
  };

  const updateCommercialModel = (i, commercialModel) => {
    const updated = [...services];
    updated[i] = {
      ...updated[i],
      commercialModel,
    };
    setFormData({ ...formData, services: updated });
  };

  const addService = () => {
    const newService = {
      name: '',
      description: '',
      keywords: [],
      deliveryTime: '',
      serviceLevel: '',
      deliveryMode: '',
      priority: '',
      targetAudience: [],
      industries: [],
      useCases: [],
      clientele: '',
      experience: '',
      pastClients: [],
      proofPoints: [],
      images: [],
      status: activeCount >= 5 ? 'Archived' : 'Active',
      isVisible: activeCount >= 5 ? false : true,
      commercialModel: createDefaultCommercialModel(),
      previewDealValue: '',
    };

    setFormData({
      ...formData,
      services: [...services, newService]
    });
  };

  const toggleArchive = (index) => {
    const updated = [...services];
    const s = updated[index];

    if (s.isVisible) {
      s.isVisible = false;
      s.status = 'Archived';
    } else {
      const count = services.filter(x => x.isVisible).length;
      if (count >= 5) return;
      s.isVisible = true;
      s.status = 'Active';
    }

    setFormData({ ...formData, services: updated });
  };
  /* ---------------- UI ---------------- */

  return (
    <Card>
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <Text variant="h3" className="flex items-center gap-2">
          <Briefcase size={18} />
          Services
        </Text>

        <div className="flex items-center gap-4">
          <Text variant="muted">
            {activeCount}/5 Active
          </Text>

          <Button variant="outline" onClick={addService}>
            <PlusCircle size={16} /> Add Service
          </Button>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-8 mt-6">
        {services.map((srv, index) => (
          <Card key={`service-${index}`}>
            {/* TITLE BAR */}
            <div className="flex justify-between items-center">
              <Text variant="h4">
                Service {index + 1}
                {srv?.isVisible ? (
                  <span className="ml-2 text-green-600 text-xs">Active</span>
                ) : (
                  <span className="ml-2 text-gray-500 text-xs">Archived</span>
                )}
              </Text>

              <Button
                variant={srv?.isVisible ? 'outline' : 'secondary'}
                onClick={() => toggleArchive(index)}
              >
                {srv?.isVisible ? 'Archive' : 'Restore'}
              </Button>
            </div>

            {/* ========== IDENTITY ========== */}
            <Text variant="h4" className="mt-6">Identity</Text>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <FormField label="Service Name">
                <Input
                  value={srv?.name || ''}
                  onChange={(e) =>
                    updateService(index, 'name', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Delivery Time">
                <Input
                  value={srv?.deliveryTime || ''}
                  onChange={(e) =>
                    updateService(index, 'deliveryTime', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Description">
                <Input
                  value={srv?.description || ''}
                  onChange={(e) =>
                    updateService(index, 'description', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Keywords">
                <TagsInput
                  value={normalizeTags(srv?.keywords)}
                  onChange={(v) =>
                    updateService(index, 'keywords', v)
                  }
                />
              </FormField>
            </div>

            {/* ========== COMMERCIAL ========== */}
            <Text variant="h4" className="flex items-center gap-2 mt-6">
              <IndianRupee size={16} />
              Commercial Model
            </Text>

            <div className="grid grid-cols-3 gap-4 mt-3">
              <div className="col-span-3">
                <CommercialModelEditor
                  value={srv?.commercialModel}
                  onChange={(nextModel) =>
                    updateCommercialModel(index, nextModel)
                  }
                  previewDealValue={srv?.previewDealValue || ''}
                  onPreviewDealValueChange={(nextValue) =>
                    updateService(index, 'previewDealValue', nextValue)
                  }
                />
              </div>
            </div>


            {/* ========== POSITIONING ========== */}
            <Text variant="h4" className="flex items-center gap-2 mt-6">
              <Target size={16} />
              Positioning
            </Text>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <FormField label="Target Audience">
                <TagsInput
                  value={normalizeTags(srv?.targetAudience)}
                  onChange={(v) =>
                    updateService(index, 'targetAudience', v)
                  }
                />
              </FormField>

              <FormField label="Industries Served">
                <TagsInput
                  value={normalizeTags(srv?.industries)}
                  onChange={(v) =>
                    updateService(index, 'industries', v)
                  }
                />
              </FormField>

              <FormField label="Use Cases">
                <TagsInput
                  value={normalizeTags(srv?.useCases)}
                  onChange={(v) =>
                    updateService(index, 'useCases', v)
                  }
                />
              </FormField>

              <FormField label="Clientele Type">
                <Select
                  value={srv?.clientele || ''}
                  onChange={(v) =>
                    updateService(index, 'clientele', v)
                  }
                  options={[
                    { label: 'Individual', value: 'Individual' },
                    { label: 'Startup', value: 'Startup' },
                    { label: 'SME', value: 'SME' },
                    { label: 'Corporate', value: 'Corporate' }
                  ]}
                />
              </FormField>
            </div>

            {/* ========== CREDIBILITY ========== */}
            <Text variant="h4" className="flex items-center gap-2 mt-6">
              <Award size={16} />
              Credibility
            </Text>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <FormField label="Experience (Years)">
                <Input
                  type="number"
                  value={srv?.experience || ''}
                  onChange={(e) =>
                    updateService(index, 'experience', e.target.value)
                  }
                />
              </FormField>

              <FormField label="Past Clients">
                <TagsInput
                  value={normalizeTags(srv?.pastClients)}
                  onChange={(v) =>
                    updateService(index, 'pastClients', v)
                  }
                />
              </FormField>

              <FormField label="Proof Points">
                <TagsInput
                  value={normalizeTags(srv?.proofPoints)}
                  onChange={(v) =>
                    updateService(index, 'proofPoints', v)
                  }
                />
              </FormField>
            </div>

            {/* ========== IMAGES ========== */}
            <Text variant="h4" className="flex items-center gap-2 mt-6">
              <ImageIcon size={16} />
              Images
            </Text>

            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                handleServiceImagesChange(index, e.target.files)
              }
            />

            <div className="grid grid-cols-5 gap-3 mt-4">
              {getSavedImages(srv).map((image, i) => (
                <div
                  key={`saved-${index}-${i}`}
                  className="bg-slate-50 p-2 rounded-lg text-xs"
                >
                  <img
                    src={image.url}
                    className="w-full h-20 object-cover rounded"
                  />
                  <div className="truncate">{image.name || `Saved ${i + 1}`}</div>
                </div>
              ))}
              {(serviceImagesTemp?.[index] || []).map((file, i) => (
                <div
                  key={`temp-${index}-${i}`}
                  className="bg-slate-50 p-2 rounded-lg text-xs"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    className="w-full h-20 object-cover rounded"
                  />
                  <div className="truncate">{file.name}</div>

                  <Button
                    variant="ghost"
                    onClick={() => removeServiceImage(index, i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}

