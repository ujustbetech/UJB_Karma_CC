'use client';

import { useMemo } from 'react';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';


export default function EventSummaryPanel({ data, activeSection, registeredCount, presentCount }) {

    /* ================= FIELD MAPPING (REAL FIRESTORE KEYS) ================= */

    const name = data?.Eventname;
    const topic = data?.titleOfTheDay;

    const participants = data?.sections || [];
    const knowledge = data?.knowledgeSections || [];
    const prospects = data?.prospectSections || [];
    const requirements = data?.requirementSections || [];
    const referrals = data?.referralSections || [];
    const documents = data?.documentUploads || [];
    const images = data?.imageUploads || [];
    const topicSections = data?.topicSections || [];




    /* ================= COMPLETION ================= */

    const sections = useMemo(() => [
        { key: 'basic', label: 'Basic Info', filled: !!name },
        { key: 'topic', label: 'Topic', filled: topicSections.length > 0 },
        { key: 'participants', label: '121 Interaction', filled: participants.length > 0 },
        { key: 'knowledge', label: 'Knowledge Sharing', filled: knowledge.length > 0 },
        { key: 'e2a', label: 'E2A', filled: referrals.length > 0 },
        { key: 'prospects', label: 'Prospects', filled: prospects.length > 0 },
        { key: 'requirements', label: 'Requirements', filled: requirements.length > 0 },
        { key: 'documents', label: 'Documents', filled: documents.length > 0 },
        { key: 'images', label: 'Images', filled: images.length > 0 },
    ], [data]);

    const completed = sections.filter(s => s.filled).length;
    const total = sections.length;
    const percent = Math.round((completed / total) * 100);

    const missing = sections.filter(s => !s.filled);

    /* ================= REGISTRATION VS PRESENT ================= */

    // const registeredCount = data?.invitedUsers?.length || 0;
    const health =
        percent >= 75
            ? { label: 'Strong', color: 'text-green-600' }
            : percent >= 45
                ? { label: 'Average', color: 'text-yellow-600' }
                : { label: 'Poor', color: 'text-red-600' };



    /* ================= ATTENDANCE ================= */

    const presentSet = new Set();

    (data?.sections || []).forEach(s => {
        if (s.selectedParticipant1) presentSet.add(s.selectedParticipant1);
        if (s.selectedParticipant2) presentSet.add(s.selectedParticipant2);
    });
    const totalRegistered = registeredCount || 0;

    const attendancePercent = totalRegistered
        ? Math.round((presentCount / totalRegistered) * 100)
        : 0;


    const totalPresent = presentCount || 0;
    const pendingCount = totalRegistered - totalPresent;



    /* ================= UI ================= */

    return (
        <div className="sticky top-4 space-y-4">

            {/* EVENT INFO */}
            <Card className="p-4">
                <Text variant="h3">Event Info</Text>

                <div className="mt-3 space-y-1 text-sm">
                    <div><b>Name:</b> {name || '-'}</div>
                    <div><b>Topic:</b> {topic || '-'}</div>
                    <div><b>Agenda Items:</b> {data?.agenda?.length || 0}</div>
                </div>
            </Card>

            {/* REGISTRATION VS PRESENT */}
            <Card className="p-4">
                <Text variant="h3">Attendance</Text>

                <div className="mt-3 space-y-2 text-sm">

                    <div className="flex justify-between">
                        <span>Registered</span>
                        <b>{registeredCount}</b>
                    </div>

                    <div className="flex justify-between">
                        <span>Present</span>
                        <b>{presentCount}</b>
                    </div>

                    <div className="flex justify-between">
                        <span>Attendance Rate</span>
                        <b>
                            {registeredCount
                                ? Math.round((presentCount / registeredCount) * 100)
                                : 0
                            }%
                        </b>
                    </div>

                </div>

                {/* progress bar */}
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-600"
                        style={{
                            width: `${registeredCount
                                ? (presentCount / registeredCount) * 100
                                : 0
                                }%`
                        }}
                    />
                </div>
            </Card>


            {/* COMPLETION */}
            <Card className="p-4">
                <Text variant="h3">Profile Completion</Text>

                <div className="mt-3 text-sm">
                    {completed} / {total} Sections Filled
                </div>

                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-slate-800"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                <div className="mt-2 text-xs text-slate-500">
                    {percent}% complete •
                    <span className={`ml-1 ${health.color}`}>{health.label}</span>
                </div>
            </Card>

            {/* QUICK STATS */}
            <Card className="p-4">
                <Text variant="h3">Quick Stats</Text>

                <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span>121 Interactions</span><b>{participants.length}</b></div>
                    <div className="flex justify-between"><span>E2A</span><b>{referrals.length}</b></div>
                    <div className="flex justify-between"><span>Prospects</span><b>{prospects.length}</b></div>
                    <div className="flex justify-between"><span>Requirements</span><b>{requirements.length}</b></div>
                    <div className="flex justify-between"><span>Knowledge</span><b>{knowledge.length}</b></div>
                    <div className="flex justify-between"><span>Documents</span><b>{documents.length}</b></div>
                    <div className="flex justify-between"><span>Images</span><b>{images.length}</b></div>
                </div>
            </Card>

            {/* MISSING */}
            {missing.length > 0 && (
                <Card className="p-4">
                    <Text variant="h3">Missing Info</Text>

                    <div className="mt-3 space-y-1 text-sm">
                        {missing.map(m => (
                            <div key={m.key} className="text-red-500">
                                • {m.label}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* ACTIVE SECTION */}
            <Card className="p-4">
                <Text variant="h3">Current Section</Text>
                <div className="mt-2 text-sm capitalize text-slate-600">
                    {activeSection}
                </div>
            </Card>

        </div>
    );
}
