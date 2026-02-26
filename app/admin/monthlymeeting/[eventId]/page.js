'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';
import { collection, onSnapshot } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';

/* ================= SECTIONS ================= */
// import BasicInfoSection from '@/components/admin/monthlymeeting/sections/BasicInfoSection';
import TopicSection from '@/components/admin/monthlymeeting/sections/TopicSection';
import ParticipantSection from '@/components/admin/monthlymeeting/sections/ParticipantSection';
import E2ASection from '@/components/admin/monthlymeeting/sections/E2ASection';
import ProspectSection from '@/components/admin/monthlymeeting/sections/ProspectSection';
import KnowledgeSharingSection from '@/components/admin/monthlymeeting/sections/KnowledgeSharingSection';
import RequirementSection from '@/components/admin/monthlymeeting/sections/RequirementSection';
import DocumentUploadSection from '@/components/admin/monthlymeeting/sections/DocumentUploadSection';
import ImageUploadSection from '@/components/admin/monthlymeeting/sections/ImageUploadSection';
import RegisteredUsersSection from '@/components/admin/monthlymeeting/sections/RegisteredUsersSection';
import AddUserSection from '@/components/admin/monthlymeeting/sections/AddUserSection';
import ConclaveSection from '@/components/admin/monthlymeeting/sections/ConclaveSection';
import EventInfoSection from '@/components/admin/monthlymeeting/sections/EventInfoSection';
import EventInfoSkeleton from '@/components/skeleton/EventInfoSkeleton';
import EventSummaryPanel from '@/components/admin/monthlymeeting/sections/EventSummaryPanel';

import {
  Info,
  BookOpen,
  Users,
  Brain,
  Target,
  ClipboardList,
  FileText,
  Image,
  UserPlus,
  Network
} from 'lucide-react';


export default function MonthlyMeetingDetailsPage() {
  const { eventId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('basic');
  const [refreshKey, setRefreshKey] = useState(0);
  const [savingAll, setSavingAll] = useState(false);

  /* ================= SECTION REFS ================= */
  const basicRef = useRef();
  const topicRef = useRef();
  const participantRef = useRef();
  const e2aRef = useRef();
  const prospectRef = useRef();
  const knowledgeRef = useRef();
  const requirementRef = useRef();
  const [registeredCount, setRegisteredCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);

  /* ================= FETCH ================= */
  const fetchData = async () => {
    if (!eventId) return;
    setLoading(true);
    const ref = doc(db, COLLECTIONS.monthlyMeeting, eventId);
    const snap = await getDoc(ref);
    setData(snap.exists() ? snap.data() : {});
    setRefreshKey(k => k + 1);
    setLoading(false);
  };

  useEffect(() => {
    if (!eventId) return;

    const unsub = onSnapshot(
      collection(db, COLLECTIONS.monthlyMeeting, eventId, 'registeredUsers'),
      (snapshot) => {
        let present = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.attendanceStatus === true) {
            present++;
          }
        });

        setRegisteredCount(snapshot.size);
        setPresentCount(present);
      }
    );

    return () => unsub();
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  /* ================= SAVE ALL ================= */
  const handleSaveAll = async () => {
    setSavingAll(true);

    const refs = [
      basicRef,
      topicRef,
      participantRef,
      e2aRef,
      prospectRef,
      knowledgeRef,
      requirementRef
    ];

    let savedAny = false;

    for (const ref of refs) {
      if (ref.current?.isDirty?.()) {
        const ok = await ref.current.save();
        if (ok) savedAny = true;
      }
    }

    if (savedAny) await fetchData();
    setSavingAll(false);
  };

  /* ================= SIDEBAR MENU ================= */

  const menuGroups = [
    {
      title: 'EVENT PROFILE',
      items: [
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'topic', label: 'Topic', icon: BookOpen },
        { id: 'participants', label: '121 Interaction', icon: Users },
        { id: 'knowledge', label: 'Knowledge Sharing', icon: Brain },
        { id: 'e2a', label: 'E2A', icon: Network },
        { id: 'prospects', label: 'Prospects', icon: Target },
        { id: 'requirements', label: 'Requirements', icon: ClipboardList },
      ]
    },
    {
      title: 'MEDIA',
      items: [
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'images', label: 'Images', icon: Image },
      ]
    },
    {
      title: 'USERS',
      items: [
        { id: 'registered', label: 'Registered Users', icon: Users },
        { id: 'adduser', label: 'Add User', icon: UserPlus },
      ]
    },
    {
      title: 'OTHER',
      items: [
        { id: 'conclave', label: 'Conclave', icon: Network },
      ]
    }
  ];



  /* ================= ACTIVE SECTION ================= */
  const renderSection = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <EventInfoSection
            ref={basicRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`basic-${refreshKey}`}
          />
        );

      case 'topic':
        return (
          <TopicSection
            ref={topicRef}
            eventID={eventId}
            data={data}
            fetchData={fetchData}
            key={`topic-${refreshKey}`}
          />
        );

      case 'participants':
        return (
          <ParticipantSection
            ref={participantRef}
            eventID={eventId}
            data={data}
            fetchData={fetchData}
            key={`participants-${refreshKey}`}
          />
        );

      case 'knowledge':
        return (
          <KnowledgeSharingSection
            ref={knowledgeRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`knowledge-${refreshKey}`}
          />
        );

      case 'e2a':
        return (
          <E2ASection
            ref={e2aRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`e2a-${refreshKey}`}
          />
        );

      case 'prospects':
        return (
          <ProspectSection
            ref={prospectRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`prospects-${refreshKey}`}
          />
        );

      case 'requirements':
        return (
          <RequirementSection
            ref={requirementRef}
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`requirements-${refreshKey}`}
          />
        );

      case 'documents':
        return (
          <DocumentUploadSection
            eventID={eventId}
            data={data}
            fetchData={fetchData}
            key={`documents-${refreshKey}`}
          />
        );

      case 'images':
        return (
          <ImageUploadSection
            eventID={eventId}
            data={data}
            fetchData={fetchData}
            key={`images-${refreshKey}`}
          />
        );

      case 'registered':
        return (
          <RegisteredUsersSection
            eventId={eventId}
            data={data}
            key={`registered-${refreshKey}`}
          />
        );

      case 'adduser':
        return (
          <AddUserSection
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`adduser-${refreshKey}`}
          />
        );

      case 'conclave':
        return (
          <ConclaveSection
            eventId={eventId}
            data={data}
            fetchData={fetchData}
            key={`conclave-${refreshKey}`}
          />
        );
    }
  };

  return (
    <div className="grid grid-cols-[260px_1fr_300px] gap-6 min-h-screen pb-32">

      {/* ================= LEFT SIDEBAR ================= */}
      <Card className="px-3 py-4 h-fit sticky top-4 bg-[#f3f4f6] border-0 shadow-none rounded-2xl">
        <Text variant="h3" className="mb-3">Profile</Text>

        {menuGroups.map(group => (
          <div key={group.title} className="mb-5">

            {/* GROUP TITLE */}
            <div className="text-xs font-semibold text-slate-400 mb-2 tracking-wide">
              {group.title}
            </div>

            {/* ITEMS */}
            <div className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`
                relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all
                
                ${isActive
                        ? 'bg-gray-200 text-slate-900 font-medium'
                        : 'text-slate-600 hover:bg-gray-100'}
              `}
                  >
                    {/* LEFT ACTIVE BAR */}
                    {isActive && (
                      <div className="absolute left-0 top-1 bottom-1 w-1 bg-slate-800 rounded-r" />
                    )}

                    <Icon size={16} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Card>



      {/* ================= CENTER ================= */}
      <div className="space-y-6">

        <Card className="flex items-center justify-between">
          <div>
            <Text variant="h1">Monthly Meeting Details</Text>
            <Text variant="muted">Event ID: {eventId}</Text>
          </div>

          <Button onClick={handleSaveAll}>
            {savingAll ? 'Saving...' : 'Save All Changes'}
          </Button>
        </Card>

        <Card className="">
          {loading ? (
            <EventInfoSkeleton />
          ) : (
            renderSection()
          )}
        </Card>

      </div>

      {/* ================= RIGHT SUMMARY PANEL ================= */}
      <div className="space-y-4">
        <EventSummaryPanel
          data={data}
          activeSection={activeSection}
          registeredCount={registeredCount}
          presentCount={presentCount}
        />

      </div>


      {/* STICKY SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 pb-4">
          <Card className="flex items-center justify-between px-4 py-3 shadow-lg border">

            <Text className="text-sm text-slate-600">
              Don’t forget to save your changes
            </Text>

            <Button onClick={handleSaveAll}>
              {savingAll ? 'Saving...' : 'Save All Changes'}
            </Button>

          </Card>
        </div>
      </div>

    </div>
  );
}
