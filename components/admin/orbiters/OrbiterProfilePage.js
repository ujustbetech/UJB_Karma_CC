'use client';

import { useState, useEffect } from 'react';
import Text from '@/components/ui/Text';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';


import {
  User,
  ShieldCheck,
  Landmark,
  Building2,
  Briefcase,
  Package,
  CreditCard,
  HeartPulse,
  GraduationCap,
  UserCog,
  Store,
  Info,
  Users,
  Network
} from 'lucide-react';

import useOrbiterProfile from '@/hooks/useOrbiterProfile';

import PersonalInfoSection from './sections/PersonalInfoSection';
import PersonalKYCSection from './sections/PersonalKYCSection';
import BankSection from './sections/BankSection';
import BusinessKYCSection from './sections/BusinessKYCSection';
import ServicesSection from './sections/ServicesSection';
import ProductsSection from './sections/ProductsSection';
import PaymentSection from './sections/PaymentSection';
import HealthSection from './sections/HealthSection';
import EducationSection from './sections/EducationSection';
import ProfessionalSection from './sections/ProfessionalSection';
import BusinessInfoSection from './sections/BusinessInfoSection';
import AdditionalInfoSection from './sections/AdditionalInfoSection';
import ReferralNetworkSection from './sections/ReferralNetworkSection';
import ProfileStrengthCard from './sections/ProfileStrengthCard';
import CloseConnectionsSection from './sections/CloseConnectionsSection';
import OrbiterBasicCard from './sections/OrbiterBasicCard';

export default function OrbiterProfilePage({ ujbcode }) {
  const toast = useToast();
  const [active, setActive] = useState('personal');
  const profile = useOrbiterProfile(ujbcode, toast);

  /* ===== CORRECT FIELD FROM FIRESTORE ===== */
  const category = profile?.data?.Category || '';
  const isCosmOrbiter =
    String(category).toLowerCase() === 'CosmOrbiter';

  useEffect(() => {
    console.log('FULL PROFILE DATA:', profile?.data);
    console.log('Category:', category);
    console.log('Is CosmOrbiter:', isCosmOrbiter);
  }, [profile?.data]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  const groupedSections = [
    {
      title: 'Personal',
      items: [
        { id: 'personal', label: 'Personal Info', icon: User },
        { id: 'kyc', label: 'Personal KYC', icon: ShieldCheck },
        { id: 'bank', label: 'Bank', icon: Landmark },
        { id: 'health', label: 'Health', icon: HeartPulse },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'professional', label: 'Professional', icon: UserCog },
        { id: 'addinfo', label: 'Additional Info', icon: Info },
      ],
    },

    {
      title: 'Business',
      items: [
        { id: 'businesskyc', label: 'Business KYC', icon: Building2 },
        { id: 'businessinfo', label: 'Business Info', icon: Store },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'payment', label: 'Payment', icon: CreditCard },
      ],
    },

    {
      title: 'Network',
      items: [
        { id: 'connects', label: 'Connects', icon: Users },
        { id: 'closeconnection', label: 'Close Connection', icon: Network },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 pb-28">

      {/* LEFT NAV */}
      <div className="col-span-2">
        <Card className="sticky top-6 p-3">
          <Text variant="h3">Profile</Text>

          <div className="mt-4 space-y-5">
            {groupedSections.map((group) => (
              <div key={group.title}>
                <div className="text-xs font-semibold text-slate-400 uppercase mb-2 px-2">
                  {group.title}
                </div>

                <div className="space-y-1">
                  {group.items.map((s) => {
                    const Icon = s.icon;
                    const isActive = active === s.id;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setActive(s.id)}
                        className={`
                          relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                          ${isActive
                            ? 'bg-brand-primary/10 text-brand-primary font-medium'
                            : 'hover:bg-slate-50 text-slate-700'}
                        `}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1 bottom-1 w-1 rounded bg-brand-primary" />
                        )}

                        <Icon size={17} />
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CENTER */}
      <div className="col-span-8 space-y-6">
        {active === 'personal' && <PersonalInfoSection profile={profile} />}
        {active === 'kyc' && <PersonalKYCSection profile={profile} />}
        {active === 'bank' && <BankSection profile={profile} />}
        {active === 'businesskyc' && <BusinessKYCSection profile={profile} />}
        {active === 'services' && <ServicesSection profile={profile} />}
        {active === 'products' && <ProductsSection profile={profile} />}
        {active === 'payment' && <PaymentSection profile={profile} />}
        {active === 'health' && <HealthSection profile={profile} />}
        {active === 'education' && <EducationSection profile={profile} />}
        {active === 'professional' && <ProfessionalSection profile={profile} />}
        {active === 'businessinfo' && <BusinessInfoSection profile={profile} />}
        {active === 'addinfo' && <AdditionalInfoSection profile={profile} />}
        {active === 'connects' && <ReferralNetworkSection profile={profile} />}
        {active === 'closeconnection' && <CloseConnectionsSection profile={profile} />}
      </div>

      {/* RIGHT */}
      <div className="col-span-2">
        <div className="sticky top-6 space-y-4">
          <OrbiterBasicCard
            profile={profile}
            // ujbcode={ujbcode}
          />
          <ProfileStrengthCard profile={profile} />

          <Card className="p-4">
            <Text variant="h4">Tips</Text>
            <ul className="mt-2 text-xs text-slate-600 space-y-1">
              <li>• Complete KYC</li>
              <li>• Add services</li>
              <li>• Add bank</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 flex justify-end gap-3 shadow-md">
        <Button variant="outline">Cancel</Button>

        <Button
          variant="primary"
          onClick={profile.handleSubmit}
          disabled={profile.loading}
        >
          {profile.loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
