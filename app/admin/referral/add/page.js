'use client';

import { useEffect, useRef, useState } from 'react';
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    query,
    orderBy,
    limit,
    where,
    setDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/firebaseConfig';
import { COLLECTIONS } from '@/lib/utility_collection';

import AdminLayout from '@/components/layout/AdminLayout';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import FormField from '@/components/ui/FormField';
import { useToast } from '@/components/ui/ToastProvider';

import { UserPlus, Users, Briefcase, Settings } from 'lucide-react';

export default function AddReferralPage() {
    const toast = useToast();
    const firstFieldRef = useRef(null);

    const [users, setUsers] = useState([]);
    const [filteredOrbiters, setFilteredOrbiters] = useState([]);
    const [filteredCosmos, setFilteredCosmos] = useState([]);

    const [orbiterSearch, setOrbiterSearch] = useState('');
    const [cosmoSearch, setCosmoSearch] = useState('');

    const [selectedOrbiter, setSelectedOrbiter] = useState(null);
    const [selectedCosmo, setSelectedCosmo] = useState(null);

    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [dealStatus, setDealStatus] = useState('Pending');
    const [refType, setRefType] = useState('Self');
    const [leadDescription, setLeadDescription] = useState('');

    const [referralSource, setReferralSource] = useState('MonthlyMeeting');
    const [otherReferralSource, setOtherReferralSource] = useState('');

    const [otherName, setOtherName] = useState('');
    const [otherPhone, setOtherPhone] = useState('');
    const [otherEmail, setOtherEmail] = useState('');

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const offeringRef = useRef(null);
    const dealRef = useRef(null);
    const [pageLoading, setPageLoading] = useState(true);

    const clearError = (field) =>
        setErrors((p) => ({
            ...p,
            [field]: '',
        }));

    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    useEffect(() => {
        if (selectedCosmo) {
            offeringRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedCosmo]);

    useEffect(() => {
        if (selectedService || selectedProduct) {
            dealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedService, selectedProduct]);


    /* ================= LOAD USERS ================= */
    useEffect(() => {
        const load = async () => {
            setPageLoading(true);

            const snap = await getDocs(collection(db, COLLECTIONS.userDetail));
            const data = snap.docs.map((d) => ({
                id: d.id,
                name: d.data().Name || '',
                phone: d.data().MobileNo || '',
                category: d.data().Category || '',
            }));

            setUsers(data);
            setPageLoading(false);
        };
        load();
    }, []);


    /* ================= AUTOSUGGEST ================= */
    const handleOrbiterSearch = (value) => {
        setOrbiterSearch(value);
        setSelectedOrbiter(null);
        clearError('orbiter');

        if (!value) return setFilteredOrbiters([]);

        setFilteredOrbiters(
            users.filter((u) =>
                u.name.toLowerCase().includes(value.toLowerCase())
            )
        );
    };

    const handleCosmoSearch = (value) => {
        setCosmoSearch(value);
        setSelectedCosmo(null);
        clearError('cosmo');

        if (!value) return setFilteredCosmos([]);

        setFilteredCosmos(
            users.filter(
                (u) =>
                    u.category.toLowerCase().includes('cosmo') &&
                    u.name.toLowerCase().includes(value.toLowerCase())
            )
        );
    };

    const selectOrbiter = (u) => {
        setSelectedOrbiter(u);
        setOrbiterSearch(u.name);
        setFilteredOrbiters([]);
    };

    const selectCosmo = async (u) => {
        setSelectedCosmo(u);
        setCosmoSearch(u.name);
        setFilteredCosmos([]);

        const snap = await getDoc(doc(db, COLLECTIONS.userDetail, u.id));
        if (snap.exists()) {
            const data = snap.data();
            setServices(data.services || []);
            setProducts(data.products || []);
        }
    };

    /* ================= VALIDATION ================= */
    const validate = () => {
        const e = {};
        if (!selectedOrbiter) e.orbiter = 'Select orbiter';
        if (!selectedCosmo) e.cosmo = 'Select cosmo';
        if (!selectedService && !selectedProduct)
            e.service = 'Select service or product';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ================= SUBMIT ================= */
    const generateReferralId = async () => {
        const now = new Date();
        const year1 = now.getFullYear() % 100;
        const year2 = (now.getFullYear() + 1) % 100;
        const prefix = `Ref/${year1}-${year2}/`;

        const q = query(
            collection(db, COLLECTIONS.referral),
            orderBy('referralId', 'desc'),
            limit(1)
        );

        const snapshot = await getDocs(q);
        let lastNum = 2999;

        if (!snapshot.empty) {
            const lastRef = snapshot.docs[0].data().referralId;
            const match = lastRef?.match(/\/(\d{8})$/);
            if (match) lastNum = parseInt(match[1], 10);
        }

        return `${prefix}${String(lastNum + 1).padStart(8, '0')}`;
    };


    /* ================= CP + MENTOR + WHATSAPP HELPERS ================= */

    const fetchMentorByUjbCode = async (ujbCode) => {
        if (!ujbCode) return null;
        const snap = await getDoc(doc(db, COLLECTIONS.userDetail, ujbCode));
        return snap.exists() ? snap.data() : null;
    };

    const ensureCpBoardUser = async (orbiter) => {
        if (!orbiter?.ujbCode) return;

        const ref = doc(db, "CPBoard", orbiter.ujbCode);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            await setDoc(ref, {
                id: orbiter.ujbCode,
                name: orbiter.name,
                phoneNumber: orbiter.phone,
                role: "Orbiter",
                totals: { R: 0, H: 0, W: 0 },
                createdAt: serverTimestamp(),
            });
        }
    };

    const updateCategoryTotals = async (orbiter, categories, points) => {
        const ref = doc(db, "CPBoard", orbiter.ujbCode);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;

        const totals = snap.data().totals || { R: 0, H: 0, W: 0 };
        const split = Math.floor(points / categories.length);

        const updated = { ...totals };
        categories.forEach((c) => {
            updated[c] = (updated[c] || 0) + split;
        });

        await updateDoc(ref, {
            totals: updated,
            lastUpdatedAt: serverTimestamp(),
        });
    };

    const addCpForSelfReferral = async (orbiter, cosmoName) => {
        await ensureCpBoardUser(orbiter);

        const q = query(
            collection(db, "CPBoard", orbiter.ujbCode, "activities"),
            where("activityNo", "==", "DIP_SELF"),
            where("cosmoName", "==", cosmoName)
        );

        const snap = await getDocs(q);
        if (!snap.empty) return;

        const points = 100;
        const categories = ["R"];

        await addDoc(
            collection(db, "CPBoard", orbiter.ujbCode, "activities"),
            {
                activityNo: "DIP_SELF",
                activityName: "Referral Identification by Self (DIP Status)",
                points,
                categories,
                cosmoName,
                source: "ReferralModule",
                month: new Date().toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                }),
                addedAt: serverTimestamp(),
            }
        );

        await updateCategoryTotals(orbiter, categories, points);
    };

    const addCpForThirdPartyReferral = async (orbiter, thirdPartyName) => {
        await ensureCpBoardUser(orbiter);

        const q = query(
            collection(db, "CPBoard", orbiter.ujbCode, "activities"),
            where("activityNo", "==", "DIP_THIRD"),
            where("thirdPartyName", "==", thirdPartyName)
        );

        const snap = await getDocs(q);
        if (!snap.empty) return;

        const points = 75;
        const categories = ["R"];

        await addDoc(
            collection(db, "CPBoard", orbiter.ujbCode, "activities"),
            {
                activityNo: "DIP_THIRD",
                activityName: "Referral passed for Third Party (DIP Status)",
                points,
                categories,
                thirdPartyName,
                source: "ReferralModule",
                month: new Date().toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                }),
                addedAt: serverTimestamp(),
            }
        );

        await updateCategoryTotals(orbiter, categories, points);
    };

    const addCpForFirstReferral = async (orbiter) => {
        await ensureCpBoardUser(orbiter);

        const q = query(
            collection(db, "CPBoard", orbiter.ujbCode, "activities"),
            where("activityNo", "==", "DIP_FIRST")
        );

        const snap = await getDocs(q);
        if (!snap.empty) return;

        const points = 125;
        const categories = ["R"];

        await addDoc(
            collection(db, "CPBoard", orbiter.ujbCode, "activities"),
            {
                activityNo: "DIP_FIRST",
                activityName: "First Referral Bonus",
                points,
                categories,
                source: "ReferralModule",
                month: new Date().toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                }),
                addedAt: serverTimestamp(),
            }
        );

        await updateCategoryTotals(orbiter, categories, points);
    };

    // ================== WHATSAPP TEMPLATE (UNCHANGED) ==================
    const sendWhatsAppTemplate = async (phone, name, message) => {
        const formatted = String(phone || "").replace(/\s+/g, "");

        const payload = {
            messaging_product: "whatsapp",
            to: formatted,
            type: "template",
            template: {
                name: "referral_module",
                language: { code: "en" },
                components: [
                    {
                        type: "body",
                        parameters: [
                            { type: "text", text: name },
                            { type: "text", text: message },
                        ],
                    },
                ],
            },
        };

        await fetch("https://graph.facebook.com/v19.0/527476310441806/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization:
                    "Bearer EAAHwbR1fvgsBOwUInBvR1SGmVLSZCpDZAkn9aZCDJYaT0h5cwyiLyIq7BnKmXAgNs0ZCC8C33UzhGWTlwhUarfbcVoBdkc1bhuxZBXvroCHiXNwZCZBVxXlZBdinVoVnTB7IC1OYS4lhNEQprXm5l0XZAICVYISvkfwTEju6kV4Aqzt4lPpN8D3FD7eIWXDhnA4SG6QZDZD",
            },
            body: JSON.stringify(payload),
        });
    };


    const handleSubmit = async () => {
        if (!validate()) return;

        setSaving(true);

        try {
            const referralId = await generateReferralId();

            // Fetch FULL data using UJBCode
            const orbiterSnap = await getDoc(
                doc(db, COLLECTIONS.userDetail, selectedOrbiter.id)
            );
            const cosmoSnap = await getDoc(
                doc(db, COLLECTIONS.userDetail, selectedCosmo.id)
            );

            const orbiterData = orbiterSnap.data() || {};
            const cosmoData = cosmoSnap.data() || {};

            // Mentor fetch
            const orbiterMentor = await fetchMentorByUjbCode(
                orbiterData.MentorUJBCode
            );
            const cosmoMentor = await fetchMentorByUjbCode(
                cosmoData.MentorUJBCode
            );

            // Fee adjustment
            let orbiterFeeAdjustment = 0;
            if (orbiterData?.payment?.orbiter?.feeType === "adjustment") {
                orbiterFeeAdjustment = 1000;
            }

            const data = {
                referralId,

                orbiter: {
                    name: orbiterData.Name || "",
                    email: orbiterData.Email || "",
                    phone: orbiterData.MobileNo || "",
                    ujbCode: orbiterData.UJBCode || "",
                    mentorName: orbiterData.MentorName || "",
                    mentorPhone: orbiterData.MentorPhone || "",
                    residentStatus: orbiterData.residentStatus ?? "Resident",
                    mentorResidentStatus:
                        orbiterMentor?.residentStatus ?? "Resident",
                },

                cosmoOrbiter: {
                    name: cosmoData.Name || "",
                    email: cosmoData.Email || "",
                    phone: cosmoData.MobileNo || "",
                    ujbCode: cosmoData.UJBCode || "",

                    mentorName: cosmoData.MentorName || "",
                    mentorPhone: cosmoData.MentorPhone || "",

                    residentStatus: cosmoData.residentStatus ?? "Resident",
                    mentorResidentStatus:
                        cosmoMentor?.residentStatus ?? "Resident",
                },


                service: selectedService,
                product: selectedProduct,
                leadDescription,

                referralType: refType,
                referralSource:
                    referralSource === "Other"
                        ? otherReferralSource
                        : referralSource,

                orbitersInfo:
                    refType === "Others"
                        ? { name: otherName, phone: otherPhone, email: otherEmail }
                        : null,

                dealStatus,
                lastUpdated: new Date(),
                timestamp: new Date(),

                payments: [],
                dealLogs: [],
                statusLogs: [
                    {
                        status: dealStatus || "Pending",
                        updatedAt: new Date().toISOString(),
                    },
                ],

                agreedTotal: 0,
                agreedRemaining: 0,
                ujbBalance: 0,
                paidToOrbiter: 0,
                paidToOrbiterMentor: 0,
                paidToCosmoMentor: 0,
                orbiterFeeAdjustment,
            };

            await addDoc(collection(db, COLLECTIONS.referral), data);

            // CP Engine
            const orbiter = {
                ujbCode: orbiterData.UJBCode,
                name: orbiterData.Name,
                phone: orbiterData.MobileNo,
            };

            if (refType === "Self") {
                await addCpForSelfReferral(orbiter, cosmoData.Name);
            }

            if (refType === "Others") {
                await addCpForThirdPartyReferral(orbiter, otherName);
            }

            if (orbiterData.ReferralPassed === "No") {
                await addCpForFirstReferral(orbiter);
                await updateDoc(
                    doc(db, COLLECTIONS.userDetail, selectedOrbiter.id),
                    { ReferralPassed: "Yes" }
                );
            }

            const serviceOrProductName =
                selectedService?.name || selectedProduct?.name || "";

            await Promise.all([
                sendWhatsAppTemplate(
                    orbiterData.MobileNo,
                    orbiterData.Name,
                    `You passed referral for ${serviceOrProductName} to ${cosmoData.Name}`
                ),
                sendWhatsAppTemplate(
                    cosmoData.MobileNo,
                    cosmoData.Name,
                    `You received referral from ${orbiterData.Name} for ${serviceOrProductName}`
                ),
            ]);

            toast.success("Referral submitted successfully");
            setSaving(false);
        } catch (err) {
            console.error(err);
            toast.error("Submission failed");
            setSaving(false);
        }
    };


    return (

        <>
            {pageLoading ? (
                <div className="p-6 space-y-6">

                    {/* Title Skeleton */}
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />

                    {/* Step Header Skeleton */}
                    <Card className="p-5">
                        <div className="flex items-center justify-between">
                            {[1, 2, 3].map((i, idx, arr) => (
                                <div key={i} className="flex items-center flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                                        <div className="space-y-1">
                                            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                                            <div className="w-28 h-2 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    {idx !== arr.length - 1 && (
                                        <div className="flex-1 h-[2px] mx-6 bg-gray-200 animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* People Section Skeleton */}
                    <Card className="p-6 space-y-5">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </Card>

                    {/* Offering Skeleton */}
                    <Card className="p-6 space-y-5">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-20 bg-gray-200 rounded animate-pulse" />
                    </Card>

                    {/* Deal Section Skeleton */}
                    <Card className="p-6 space-y-5">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded animate-pulse" />
                        </div>
                        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse ml-auto" />
                    </Card>

                </div>
            ) : (

                <div className="p-6 space-y-6">
                    {/* PAGE HEADER */}
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                        <Text as="h1">Add Referral</Text>
                    </div>

                    {/* ===== Sticky Step Header ===== */}
                    <div className="sticky top-0 z-30">
                        <Card className="p-5">
                            {(() => {
                                // --- Completion logic ---
                                const isPeopleDone = selectedOrbiter && selectedCosmo;
                                const isOfferingDone = selectedService || selectedProduct;
                                const isDealDone =
                                    dealStatus &&
                                    refType &&
                                    referralSource &&
                                    (refType !== 'Others' ||
                                        (otherName && otherPhone && otherEmail));

                                // current step index (1..4 where 4 = all done)
                                const current = !isPeopleDone
                                    ? 1
                                    : !isOfferingDone
                                        ? 2
                                        : !isDealDone
                                            ? 3
                                            : 4;

                                const steps = [
                                    { id: 1, title: 'People', desc: 'Select Orbiter & Cosmo' },
                                    { id: 2, title: 'Offering', desc: 'Service / Product' },
                                    { id: 3, title: 'Deal', desc: 'Configure details' },
                                ];

                                return (
                                    <div className="flex items-center justify-between">
                                        {steps.map((step, idx) => {
                                            const isActive = current === step.id;
                                            const isCompleted = current > step.id;

                                            return (
                                                <div key={step.id} className="flex items-center flex-1">
                                                    {/* Circle */}
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm font-semibold
                      ${isCompleted
                                                                    ? 'bg-green-600 text-white border-green-600'
                                                                    : isActive
                                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                                        : 'bg-white text-gray-500 border-gray-300'
                                                                }`}
                                                        >
                                                            {step.id}
                                                        </div>

                                                        <div>
                                                            <Text as="h3">{step.title}</Text>
                                                            <Text className="text-xs text-gray-500">{step.desc}</Text>
                                                        </div>
                                                    </div>

                                                    {/* Connector */}
                                                    {idx !== steps.length - 1 && (
                                                        <div
                                                            className={`flex-1 h-[2px] mx-6 ${current > step.id ? 'bg-green-600' : 'bg-gray-200'
                                                                }`}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </Card>
                    </div>


                    {(selectedOrbiter || selectedCosmo) && (
                        <Card className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {selectedOrbiter && (
                                    <div>
                                        <Text as="h3">Selected Orbiter</Text>
                                        <Text className="text-sm text-gray-700">{selectedOrbiter.name}</Text>
                                        <Text className="text-xs text-gray-500">{selectedOrbiter.phone}</Text>
                                    </div>
                                )}

                                {selectedCosmo && (
                                    <div>
                                        <Text as="h3">Selected Cosmo</Text>
                                        <Text className="text-sm text-gray-700">{selectedCosmo.name}</Text>
                                        <Text className="text-xs text-gray-500">{selectedCosmo.phone}</Text>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}


                    {/* ================= PEOPLE ================= */}
                    <Card ref={offeringRef} className="p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <Text as="h2">Select People</Text>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Orbiter */}
                            <FormField label="Search Orbiter" error={errors.orbiter} required>
                                <div className="relative">
                                    <Input
                                        ref={firstFieldRef}
                                        value={orbiterSearch}
                                        onChange={(e) => handleOrbiterSearch(e.target.value)}
                                        error={!!errors.orbiter}
                                        placeholder="Type member name"
                                    />
                                    {filteredOrbiters.length > 0 && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow max-h-56 overflow-auto">
                                            {filteredOrbiters.map((u) => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => selectOrbiter(u)}
                                                    className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                                                >
                                                    <div className="text-sm font-medium">{u.name}</div>
                                                    <div className="text-xs text-gray-500">{u.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FormField>

                            {/* Cosmo */}
                            <FormField label="Search Cosmo Orbiter" error={errors.cosmo} required>
                                <div className="relative">
                                    <Input
                                        value={cosmoSearch}
                                        onChange={(e) => handleCosmoSearch(e.target.value)}
                                        error={!!errors.cosmo}
                                        placeholder="Type cosmo name"
                                    />
                                    {filteredCosmos.length > 0 && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg  shadow max-h-56 overflow-auto">
                                            {filteredCosmos.map((u) => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => selectCosmo(u)}
                                                    className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                                                >
                                                    <div className="text-sm font-medium">{u.name}</div>
                                                    <div className="text-xs text-gray-500">{u.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FormField>
                        </div>
                    </Card>

                    {/* ================= OFFERING ================= */}
                    {selectedCosmo && (
                        <Card ref={dealRef} className="p-6 space-y-5">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <Text as="h2">Offering</Text>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField label="Service" error={errors.service}>
                                    <Select
                                        value={selectedService?.name || ''}
                                        onChange={(val) => {
                                            const found = services.find((s) => s.name === val);
                                            setSelectedService(found || null);
                                            setSelectedProduct(null);
                                            clearError('service');
                                        }}
                                        options={[
                                            { label: 'Select Service', value: '' },
                                            ...services.map((s) => ({
                                                label: s.name,
                                                value: s.name,
                                            })),
                                        ]}
                                    />
                                </FormField>

                                <FormField label="Product" error={errors.service}>
                                    <Select
                                        value={selectedProduct?.name || ''}
                                        onChange={(val) => {
                                            const found = products.find((p) => p.name === val);
                                            setSelectedProduct(found || null);
                                            setSelectedService(null);
                                            clearError('service');
                                        }}
                                        options={[
                                            { label: 'Select Product', value: '' },
                                            ...products.map((p) => ({
                                                label: p.name,
                                                value: p.name,
                                            })),
                                        ]}
                                    />
                                </FormField>
                            </div>

                            {(selectedService || selectedProduct) && (
                                <FormField label="Lead Description">
                                    <Textarea
                                        value={leadDescription}
                                        onChange={(e) => setLeadDescription(e.target.value)}
                                    />
                                </FormField>
                            )}
                        </Card>
                    )}

                    {/* ================= DEAL SETTINGS ================= */}
                    <Card className="p-6 space-y-5">
                        <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-600" />
                            <Text as="h2">Deal Details</Text>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Deal Status">
                                <Select
                                    value={dealStatus}
                                    onChange={(val) => setDealStatus(val)}
                                    options={[
                                        { label: 'Pending', value: 'Pending' },
                                        { label: 'Deal Won', value: 'Deal Won' },
                                        { label: 'Deal Lost', value: 'Deal Lost' },
                                        { label: 'Work in Progress', value: 'Work in Progress' },
                                        { label: 'Work Completed', value: 'Work Completed' },
                                    ]}
                                />
                            </FormField>

                            <FormField label="Referral Type">
                                <Select
                                    value={refType}
                                    onChange={(val) => setRefType(val)}
                                    options={[
                                        { label: 'Self', value: 'Self' },
                                        { label: 'Others', value: 'Others' },
                                    ]}
                                />
                            </FormField>
                        </div>

                        {refType === 'Others' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField label="Referrer Name">
                                    <Input
                                        value={otherName}
                                        onChange={(e) => setOtherName(e.target.value)}
                                    />
                                </FormField>

                                <FormField label="Referrer Phone">
                                    <Input
                                        value={otherPhone}
                                        onChange={(e) => setOtherPhone(e.target.value)}
                                    />
                                </FormField>

                                <FormField label="Referrer Email">
                                    <Input
                                        value={otherEmail}
                                        onChange={(e) => setOtherEmail(e.target.value)}
                                    />
                                </FormField>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Referral Source">
                                <Select
                                    value={referralSource}
                                    onChange={(val) => setReferralSource(val)}
                                    options={[
                                        { label: 'Monthly Meeting', value: 'MonthlyMeeting' },
                                        { label: 'Conclave Meeting', value: 'ConclaveMeeting' },
                                        { label: 'OTC Meeting', value: 'OTCMeeting' },
                                        { label: 'Phone', value: 'Phone' },
                                        { label: 'Other', value: 'Other' },
                                    ]}
                                />
                            </FormField>

                            {referralSource === 'Other' && (
                                <FormField label="Other Source">
                                    <Input
                                        value={otherReferralSource}
                                        onChange={(e) => setOtherReferralSource(e.target.value)}
                                    />
                                </FormField>
                            )}
                        </div>

                        {/* <div className="flex justify-end pt-4">
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : 'Submit Referral'}
                        </Button>
                    </div> */}
                        {selectedOrbiter && (
                            <Card className="p-4 bg-blue-50 border">
                                <Text as="h3">Contribution Points Preview</Text>

                                <Text className="text-sm text-gray-700">
                                    {refType === 'Self' && 'You will earn 100 CP for Self Referral'}
                                    {refType === 'Others' && 'You will earn 75 CP for Third-Party Referral'}
                                </Text>

                                <Text className="text-xs text-gray-500 mt-1">
                                    First referral bonus: +125 CP (auto applied once)
                                </Text>
                            </Card>
                        )}
                    </Card>

                    {/* <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end">
                    <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving…' : 'Submit Referral'}
                    </Button>
                </div> */}

                    <div className="fixed bottom-0 left-0 right-0 z-40">
                        <div className="max-w-[1400px] mx-auto px-6 pb-4">
                            <Card className="flex items-center justify-between px-4 py-3 shadow-lg border">

                                <Text className="text-sm text-slate-600">
                                    Don’t forget to save your changes
                                </Text>

                                <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                                    {saving ? 'Saving…' : 'Submit Referral'}
                                </Button>

                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
