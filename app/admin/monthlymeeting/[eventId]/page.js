'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

/* ================= SECTIONS ================= */
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

  const basicRef = useRef();
  const topicRef = useRef();
  const participantRef = useRef();
  const e2aRef = useRef();
  const prospectRef = useRef();
  const knowledgeRef = useRef();
  const requirementRef = useRef();

  const [registeredCount, setRegisteredCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);

  /* ================= FETCH EVENT ================= */
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
    fetchData();
  }, [eventId]);

  /* ================= REALTIME REGISTERED USERS ================= */
  useEffect(() => {
    if (!eventId) return;

    const unsub = onSnapshot(
      collection(db, COLLECTIONS.monthlyMeeting, eventId, 'registeredUsers'),
      (snapshot) => {
        let present = 0;

        snapshot.forEach(doc => {
          if (doc.data().attendanceStatus === true) present++;
        });

        setRegisteredCount(snapshot.size);
        setPresentCount(present);
      }
    );

    return () => unsub();
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

  /* ================= TABS ================= */
  const tabs = [
    { id: 'basic', label: 'Basic', icon: Info },
    { id: 'topic', label: 'Topic', icon: BookOpen },
    { id: 'participants', label: '121', icon: Users },
    { id: 'knowledge', label: 'Knowledge', icon: Brain },
    { id: 'e2a', label: 'E2A', icon: Network },
    { id: 'prospects', label: 'Prospects', icon: Target },
    { id: 'requirements', label: 'Requirements', icon: ClipboardList },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'images', label: 'Images', icon: Image },
    { id: 'registered', label: 'Users', icon: Users },
    { id: 'adduser', label: 'Add User', icon: UserPlus },
    { id: 'conclave', label: 'Conclave', icon: Network }
  ];

  /* ================= SECTION RENDER ================= */
  const renderSection = () => {
    switch (activeSection) {
      case 'basic':
        return <EventInfoSection ref={basicRef} eventId={eventId} data={data} fetchData={fetchData} key={refreshKey} />;
      case 'topic':
        return <TopicSection ref={topicRef} eventID={eventId} data={data} fetchData={fetchData} />;
      case 'participants':
        return <ParticipantSection ref={participantRef} eventID={eventId} data={data} fetchData={fetchData} />;
      case 'knowledge':
        return <KnowledgeSharingSection ref={knowledgeRef} eventId={eventId} data={data} fetchData={fetchData} />;
      case 'e2a':
        return <E2ASection ref={e2aRef} eventId={eventId} data={data} fetchData={fetchData} />;
      case 'prospects':
        return <ProspectSection ref={prospectRef} eventId={eventId} data={data} fetchData={fetchData} />;
      case 'requirements':
        return <RequirementSection ref={requirementRef} eventId={eventId} data={data} fetchData={fetchData} />;
      case 'documents':
        return <DocumentUploadSection eventID={eventId} data={data} fetchData={fetchData} />;
      case 'images':
        return <ImageUploadSection eventID={eventId} data={data} fetchData={fetchData} />;
      case 'registered':
        return <RegisteredUsersSection eventId={eventId} data={data} />;
      case 'adduser':
        return <AddUserSection eventId={eventId} data={data} fetchData={fetchData} />;
      case 'conclave':
        return <ConclaveSection eventId={eventId} data={data} fetchData={fetchData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] pb-20">

      {/* ================= HERO ================= */}
      <div className="relative h-[280px] w-full">
        <img
          src="/space.jpeg"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-[#0b1120]" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
          <h1 className="text-2xl font-bold">
            {data?.Eventname || 'Monthly Meeting'}
          </h1>

          <p className="text-sm mt-2 opacity-80">
            {data?.time
              ? new Date(data.time.seconds * 1000).toLocaleString()
              : 'Event Date'}
          </p>

          <div className="mt-4 bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-xs font-medium">
            In Progress
          </div>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="max-w-3xl mx-auto px-5 -mt-8">

        {/* USERS CARD */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between text-white mb-6">
          <div className="text-sm">
            👥 {registeredCount} people joining
          </div>
          <div className="text-xs opacity-70">
            Present: {presentCount}
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-3 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-3xl shadow-xl p-6 min-h-[400px]">
          {loading ? <EventInfoSkeleton /> : renderSection()}
        </div>

        {/* SAVE BUTTON */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSaveAll}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            {savingAll ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}