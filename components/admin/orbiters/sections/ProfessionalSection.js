'use client';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import FormField from '@/components/ui/FormField';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TagsInput from '@/components/ui/TagsInput';

import {
    Briefcase,
    Building2,
    UserCog,
    GraduationCap,
    HeartHandshake,
    Award
} from 'lucide-react';

export default function ProfessionalSection({ profile }) {
    const { formData = {}, handleChange } = profile;

    const professionType = formData?.ProfessionType || '';

    const clean = (v) => (!v || v === '—' ? '' : v);

    const set = (key, val) => handleChange(key, val);

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
            <Text variant="h3" className="flex items-center gap-2">
                <Briefcase size={18} /> Professional Details
            </Text>

            {/* ================= PROFESSION TYPE ================= */}
            <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField label="Profession Type">
                    <Select
                        value={professionType}
                        onChange={(val) => set('ProfessionType', val)}
                        options={[
                            { label: 'Select', value: '' },
                            { label: 'Entrepreneur', value: 'Entrepreneur' },
                            { label: 'Salaried', value: 'Salaried' },
                            { label: 'Freelancer', value: 'Freelancer' },
                            { label: 'Student', value: 'Student' },
                            { label: 'Home Maker', value: 'Home Maker' },
                            { label: 'Retired', value: 'Retired' }
                        ]}
                    />
                </FormField>
            </div>

            {/* ================= ENTREPRENEUR ================= */}
            {professionType === 'Entrepreneur' && (
                <>
                    <Text variant="h4" className="flex items-center gap-2 mt-8">
                        <Building2 size={18} /> Business Profile
                    </Text>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <FormField label="Business History">
                            <Input
                                value={clean(formData.BusinessHistory)}
                                onChange={(e) => set('BusinessHistory', e.target.value)}
                            />
                        </FormField>

                        <FormField label="USP">
                            <Input
                                value={clean(formData.USP)}
                                onChange={(e) => set('USP', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Area Of Services">
                            <TagsInput
                                value={toArray(formData.AreaOfServices)}
                                onChange={(v) => set('AreaOfServices', v)}
                                placeholder="Add services..."
                            />
                        </FormField>

                        <FormField label="Clientele Base">
                            <Input
                                value={clean(formData.ClienteleBase)}
                                onChange={(e) => set('ClienteleBase', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Tag Line">
                            <Input
                                value={clean(formData.TagLine)}
                                onChange={(e) => set('TagLine', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Aspirations">
                            <TagsInput
                                value={toArray(formData.Aspirations)}
                                onChange={(v) => set('Aspirations', v)}
                                placeholder="Growth goals..."
                            />
                        </FormField>

                        <FormField label="Immediate Desire">
                            <TagsInput
                                value={toArray(formData.ImmediateDesire)}
                                onChange={(v) => set('ImmediateDesire', v)}
                            />
                        </FormField>

                        <FormField label="Mastery Areas">
                            <TagsInput
                                value={toArray(formData.Mastery)}
                                onChange={(v) => set('Mastery', v)}
                            />
                        </FormField>
                    </div>
                </>
            )}

            {/* ================= SALARIED ================= */}
            {professionType === 'Salaried' && (
                <>
                    <Text variant="h4" className="flex items-center gap-2 mt-8">
                        <UserCog size={18} /> Job Details
                    </Text>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <FormField label="Company Name">
                            <Input
                                value={clean(formData.CompanyName)}
                                onChange={(e) => set('CompanyName', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Job Title">
                            <Input
                                value={clean(formData.JobTitle)}
                                onChange={(e) => set('JobTitle', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Department">
                            <Input
                                value={clean(formData.Department)}
                                onChange={(e) => set('Department', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Industry">
                            <Input
                                value={clean(formData.Industry)}
                                onChange={(e) => set('Industry', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Years of Experience">
                            <Input
                                type="number"
                                value={clean(formData.ExperienceYears)}
                                onChange={(e) => set('ExperienceYears', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Skills">
                            <TagsInput
                                value={toArray(formData.Skills)}
                                onChange={(v) => set('Skills', v)}
                            />
                        </FormField>

                        <FormField label="Expertise">
                            <TagsInput
                                value={toArray(formData.Expertise)}
                                onChange={(v) => set('Expertise', v)}
                            />
                        </FormField>

                        <FormField label="Career Aspirations">
                            <TagsInput
                                value={toArray(formData.CareerAspirations)}
                                onChange={(v) => set('CareerAspirations', v)}
                            />
                        </FormField>
                    </div>
                </>
            )}

            {/* ================= FREELANCER ================= */}
            {professionType === 'Freelancer' && (
                <>
                    <Text variant="h4" className="flex items-center gap-2 mt-8">
                        <Briefcase size={18} /> Freelance Profile
                    </Text>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <FormField label="Services Offered">
                            <TagsInput
                                value={toArray(formData.FreelanceServices)}
                                onChange={(v) => set('FreelanceServices', v)}
                            />
                        </FormField>

                        <FormField label="Platforms">
                            <TagsInput
                                value={toArray(formData.Platforms)}
                                onChange={(v) => set('Platforms', v)}
                                placeholder="Upwork, Fiverr..."
                            />
                        </FormField>

                        <FormField label="Portfolio URL">
                            <Input
                                value={clean(formData.PortfolioURL)}
                                onChange={(e) => set('PortfolioURL', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Experience Years">
                            <Input
                                type="number"
                                value={clean(formData.FreelanceExperience)}
                                onChange={(e) => set('FreelanceExperience', e.target.value)}
                            />
                        </FormField>
                    </div>
                </>
            )}

            {/* ================= STUDENT ================= */}
            {professionType === 'Student' && (
                <>
                    <Text variant="h4" className="flex items-center gap-2 mt-8">
                        <GraduationCap size={18} /> Education Track
                    </Text>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <FormField label="College Name">
                            <Input
                                value={clean(formData.CollegeName)}
                                onChange={(e) => set('CollegeName', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Course">
                            <Input
                                value={clean(formData.Course)}
                                onChange={(e) => set('Course', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Specialization">
                            <Input
                                value={clean(formData.Specialization)}
                                onChange={(e) => set('Specialization', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Skills">
                            <TagsInput
                                value={toArray(formData.Skills)}
                                onChange={(v) => set('Skills', v)}
                            />
                        </FormField>

                        <FormField label="Career Interests">
                            <TagsInput
                                value={toArray(formData.CareerInterests)}
                                onChange={(v) => set('CareerInterests', v)}
                            />
                        </FormField>
                    </div>
                </>
            )}
            {/* ================= HOMEMAKER ================= */}
            {professionType === 'Home Maker' && (
                <>
                    <Text variant="h4" className="flex items-center gap-2 mt-8">
                        <HeartHandshake size={18} />
                        Personal Profile
                    </Text>

                    <div className="grid grid-cols-2 gap-4 mt-3">

                        <FormField label="Primary Role">
                            <Input
                                value={clean(formData.PrimaryRole)}
                                onChange={(e) => set('PrimaryRole', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Family Type">
                            <Select
                                value={clean(formData.FamilyType)}
                                onChange={(val) => set('FamilyType', val)}
                                options={[
                                    { label: 'Select', value: '' },
                                    { label: 'Nuclear', value: 'Nuclear' },
                                    { label: 'Joint', value: 'Joint' }
                                ]}
                            />
                        </FormField>

                        <FormField label="Skills">
                            <TagsInput
                                value={toArray(formData.Skills)}
                                onChange={(v) => set('Skills', v)}
                            />
                        </FormField>

                        <FormField label="Hobbies">
                            <TagsInput
                                value={toArray(formData.Hobbies)}
                                onChange={(v) => set('Hobbies', v)}
                            />
                        </FormField>

                        <FormField label="Interest Areas">
                            <TagsInput
                                value={toArray(formData.InterestArea)}
                                onChange={(v) => set('InterestArea', v)}
                            />
                        </FormField>

                        <FormField label="Contribution Areas">
                            <TagsInput
                                value={toArray(formData.ContributionAreainUJustBe)}
                                onChange={(v) => set('ContributionAreainUJustBe', v)}
                            />
                        </FormField>

                        <FormField label="Aspirations">
                            <TagsInput
                                value={toArray(formData.Aspirations)}
                                onChange={(v) => set('Aspirations', v)}
                            />
                        </FormField>

                        <FormField label="Immediate Desire">
                            <TagsInput
                                value={toArray(formData.ImmediateDesire)}
                                onChange={(v) => set('ImmediateDesire', v)}
                            />
                        </FormField>

                    </div>
                </>
            )}
            {/* ================= RETIRED ================= */}
            {professionType === 'Retired' && (
                <>
                    <Text variant="h4" className="flex items-center gap-2 mt-8">
                        <Award size={18} />
                        Experience & Mentorship
                    </Text>

                    <div className="grid grid-cols-2 gap-4 mt-3">

                        <FormField label="Previous Profession">
                            <Input
                                value={clean(formData.PreviousProfession)}
                                onChange={(e) => set('PreviousProfession', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Industry">
                            <Input
                                value={clean(formData.PreviousIndustry)}
                                onChange={(e) => set('PreviousIndustry', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Last Organization">
                            <Input
                                value={clean(formData.LastOrganization)}
                                onChange={(e) => set('LastOrganization', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Total Experience (Years)">
                            <Input
                                type="number"
                                value={clean(formData.TotalExperience)}
                                onChange={(e) => set('TotalExperience', e.target.value)}
                            />
                        </FormField>

                        <FormField label="Mastery Areas">
                            <TagsInput
                                value={toArray(formData.Mastery)}
                                onChange={(v) => set('Mastery', v)}
                            />
                        </FormField>

                        <FormField label="Skills">
                            <TagsInput
                                value={toArray(formData.Skills)}
                                onChange={(v) => set('Skills', v)}
                            />
                        </FormField>

                        <FormField label="Mentorship Interest">
                            <Select
                                value={clean(formData.MentorshipInterest)}
                                onChange={(val) => set('MentorshipInterest', val)}
                                options={[
                                    { label: 'Select', value: '' },
                                    { label: 'Yes', value: 'Yes' },
                                    { label: 'No', value: 'No' }
                                ]}
                            />
                        </FormField>

                        <FormField label="Can Support In">
                            <TagsInput
                                value={toArray(formData.SupportAreas)}
                                onChange={(v) => set('SupportAreas', v)}
                            />
                        </FormField>

                    </div>
                </>
            )}


        </Card>
    );
}
