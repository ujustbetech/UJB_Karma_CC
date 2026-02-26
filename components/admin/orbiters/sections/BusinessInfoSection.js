'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import TagsInput from '@/components/ui/TagsInput';

import { Building2, Briefcase, Target, Globe } from 'lucide-react';
import Select from '@/components/ui/Select';

export default function BusinessInfoSection({ profile }) {
    const { formData = {}, handleChange } = profile;

    const clean = (v) => (!v || v === '—' ? '' : v);
    const set = (k, v) => handleChange(k, v);

    const toArray = (val) => {
        if (Array.isArray(val)) return val;
        if (!val || val === '—') return [];
        if (typeof val === 'string') {
            return val.split(',').map(v => v.trim()).filter(Boolean);
        }
        return [];
    };

    return (
        <Card>
            {/* MAIN HEADING */}
            <Text variant="h3" className="flex items-center gap-2">
                <Building2 size={18} />
                Business Info
            </Text>

            {/* ================= IDENTITY ================= */}
            <Text variant="h4" className="flex items-center gap-2 mt-6">
                <Briefcase size={16} />
                Business Identity
            </Text>

            <div className="grid grid-cols-2 gap-4 mt-3">
                <FormField label="Business Name">
                    <Input
                        value={clean(formData.BusinessName)}
                        onChange={(e) => set('BusinessName', e.target.value)}
                    />
                </FormField>
                <FormField label="Business Stage">
                    <Select
                        value={clean(formData.BusinessStage)}
                        onChange={(val) => set('BusinessStage', val)}
                        options={[
                            { label: 'Select', value: '' },
                            { label: 'Startup', value: 'Startup' },
                            { label: 'Growing', value: 'Growing' },
                            { label: 'Established', value: 'Established' },
                            { label: 'Scaling', value: 'Scaling' }
                        ]}
                    />
                </FormField>

                <FormField label="Established Year">
                    <Input
                        value={clean(formData.EstablishedAt)}
                        onChange={(e) => set('EstablishedAt', e.target.value)}
                    />
                </FormField>

                <FormField label="Business Email">
                    <Input
                        value={clean(formData.BusinessEmailID)}
                        onChange={(e) => set('BusinessEmailID', e.target.value)}
                    />
                </FormField>

                <FormField label="Tag Line">
                    <Input
                        value={clean(formData.TagLine)}
                        onChange={(e) => set('TagLine', e.target.value)}
                    />
                </FormField>
            </div>


            {/* ================= DETAILS ================= */}
            <Text variant="h4" className="flex items-center gap-2 mt-8">
                <Briefcase size={16} />
                Business Details
            </Text>

            <div className="grid grid-cols-2 gap-4 mt-3">
                <FormField label="Business Type">
                    <Input
                        value={clean(formData.BusinessDetails)}
                        onChange={(e) => set('BusinessDetails', e.target.value)}
                    />
                </FormField>

                <FormField label="Locality">
                    <Input
                        value={clean(formData.Locality)}
                        onChange={(e) => set('Locality', e.target.value)}
                    />
                </FormField>

                <FormField label="Business History">
                    <Input
                        value={clean(formData.BusinessHistory)}
                        onChange={(e) => set('BusinessHistory', e.target.value)}
                    />
                </FormField>

                <FormField label="Noteworthy Achievements">
                    <Input
                        value={clean(formData.NoteworthyAchievements)}
                        onChange={(e) => set('NoteworthyAchievements', e.target.value)}
                    />
                </FormField>
            </div>

            {/* ================= POSITIONING ================= */}
            <Text variant="h4" className="flex items-center gap-2 mt-8">
                <Target size={16} />
                Positioning
            </Text>

            <div className="grid grid-cols-2 gap-4 mt-3">
                <FormField label="USP">
                    <Input
                        value={clean(formData.USP)}
                        onChange={(e) => set('USP', e.target.value)}
                    />
                </FormField>

                <FormField label="Clientele Base">
                    <Input
                        value={clean(formData.ClienteleBase)}
                        onChange={(e) => set('ClienteleBase', e.target.value)}
                    />
                </FormField>

                <FormField label="Primary Category">
                    <Input
                        value={clean(formData.Category1)}
                        onChange={(e) => set('Category1', e.target.value)}
                    />
                </FormField>

                <FormField label="Secondary Category">
                    <Input
                        value={clean(formData.Category2)}
                        onChange={(e) => set('Category2', e.target.value)}
                    />
                </FormField>
            </div>

            {/* ================= MARKET PRESENCE ================= */}
            <Text variant="h4" className="flex items-center gap-2 mt-8">
                <Globe size={16} />
                Market Presence
            </Text>

            <div className="grid grid-cols-2 gap-4 mt-3">
                <FormField label="Area Of Services">
                    <TagsInput
                        value={toArray(formData.AreaOfServices)}
                        onChange={(v) => set('AreaOfServices', v)}
                    />
                </FormField>

                <FormField label="Website">
                    <Input
                        value={clean(formData.Website)}
                        onChange={(e) => set('Website', e.target.value)}
                    />
                </FormField>
            </div>
        </Card>
    );
}
