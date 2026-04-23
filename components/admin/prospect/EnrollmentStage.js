import React, { useEffect, useMemo, useState } from "react";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";

import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

const STAGE_OPTIONS = [
  {
    label: "Enrollment Initiation",
    statuses: [
      "Initiation not started",
      "Initiation in progress",
      "Initiation completed",
    ],
  },
  {
    label: "Enrollment documents mail",
    statuses: ["Documents pending", "Documents sent", "Documents need revision"],
  },
  {
    label: "Enrollment Fees Mail Status",
    statuses: ["Fee mail pending", "Fee mail sent", "Fee follow-up required"],
  },
  {
    label: "Enrollment fees Option Opted for",
    statuses: [
      "Option pending",
      "Upfront payment selected",
      "Adjustment selected",
      "No response - adjustment applied",
      "Upfront payment confirmed",
    ],
  },
  {
    label: "Enrollments Completion Status",
    statuses: ["Completion pending", "Enrollment completed", "Enrollment withdrawn"],
  },
];

const sanitizeText = (text) =>
  String(text || "")
    .replace(/[\n\t]/g, " ")
    .replace(/ {5,}/g, "    ")
    .trim();

const formatLogDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString("en-IN");
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString("en-IN");
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleString("en-IN");
};

const stringifyValue = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value?.seconds) {
    return `${value.seconds}-${value.nanoseconds || 0}`;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatStageDate = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(`${value}T00:00:00`);
      return Number.isNaN(parsed.getTime())
        ? value
        : parsed.toLocaleDateString("en-IN");
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleDateString("en-IN");
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-IN");
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleDateString("en-IN");
};

const normalizeDateValue = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [month, day, year] = value.split("/");
      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toISOString().split("T")[0];
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
};

const getLogKey = (log, index) => {
  if (log?.id) {
    return String(log.id);
  }

  const clickedAt =
    log?.clickedAt && typeof log.clickedAt === "object"
      ? `${log.clickedAt.seconds || 0}-${log.clickedAt.nanoseconds || 0}`
      : stringifyValue(log?.clickedAt || "no-date");

  const action = stringifyValue(log?.action || "no-action");
  const targetLabel = stringifyValue(
    log?.targetLabel || log?.label || "no-target"
  );
  const clickedBy = stringifyValue(log?.clickedBy || "no-user");

  return `${clickedAt}-${action}-${targetLabel}-${clickedBy}-${index}`;
};

const getLogTitle = (log) => {
  const actionLabel =
    log.action === "send_email"
      ? "Notification sent"
      : log.action === "save"
        ? "Enrollment stages saved"
        : "Enrollment update";
  const label = log.targetLabel || log.label || "";

  return label ? `${actionLabel} - ${label}` : actionLabel;
};

const normalizeRows = (savedRows) =>
  STAGE_OPTIONS.map((stage) => {
    const match = savedRows.find((item) => item.label === stage.label);

    return (
      match || {
        label: stage.label,
        checked: false,
        date: "",
        status: "",
        sent: false,
      }
    );
  }).map((row) => ({
    ...row,
    date: normalizeDateValue(row.date),
  }));

const EnrollmentStage = ({ id, fetchData }) => {
  const [rows, setRows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prospectMeta, setProspectMeta] = useState({
    prospectName: "",
    email: "",
    prospectPhone: "",
    orbiterName: "Orbiter",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(
          `/api/admin/prospects?id=${id}&section=enrollmentstages`,
          {
            credentials: "include",
          }
        );
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(responseData.message || "Failed to load enrollment stages");
        }

        const prospect = responseData.prospect || {};

        setRows(
          normalizeRows(
            Array.isArray(responseData.enrollmentStages)
              ? responseData.enrollmentStages
              : []
          )
        );
        setLogs(
          Array.isArray(responseData.enrollmentStageLogs)
            ? responseData.enrollmentStageLogs
            : []
        );
        setProspectMeta({
          prospectName: prospect.prospectName || "",
          email: prospect.email || "",
          prospectPhone: prospect.prospectPhone || "",
          orbiterName: prospect.orbiterName || "Orbiter",
        });
      } catch (err) {
        console.error("Error loading enrollment data:", err);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const stagedRows = useMemo(() => rows, [rows]);

  const isRowUnlocked = (index) => {
    if (index === 0) return true;

    const previousRow = stagedRows[index - 1];
    return Boolean(previousRow?.checked && previousRow?.status);
  };

  const canSend = (row, index) =>
    isRowUnlocked(index) && Boolean(row.checked && row.date && row.status);

  const getSendLabel = (row) => {
    if (row.sent) return "Sent";

    switch (row.label) {
      case "Enrollment Initiation":
        return "Send initiation";
      case "Enrollment documents mail":
        return "Send document mail";
      case "Enrollment Fees Mail Status":
        return "Send fee mail";
      case "Enrollment fees Option Opted for":
        return "Send fee option";
      case "Enrollments Completion Status":
        return "Send completion";
      default:
        return "Send";
    }
  };

  const handleChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const nextRow = {
          ...row,
          [field]: value,
        };

        if (field !== "sent") {
          nextRow.sent = false;
        }

        return nextRow;
      })
    );
  };

  const persistRows = async (nextRows, action, targetLabel = "", logMeta = {}) => {
    const res = await fetch(
      `/api/admin/prospects?id=${id}&section=enrollmentstages`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rows: nextRows,
          action,
          targetLabel,
          previousLogs: logs,
          logMeta,
        }),
      }
    );

    const responseData = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(responseData.message || "Failed to save enrollment stages");
    }

    const prospect = responseData.prospect || {};

    setRows(
      normalizeRows(
        Array.isArray(prospect.enrollmentStages)
          ? prospect.enrollmentStages
          : nextRows
      )
    );
    setLogs(
      Array.isArray(prospect.enrollmentStageLogs)
        ? prospect.enrollmentStageLogs
        : logs
    );

    return responseData;
  };

  const buildStageMessages = (label, status, date) => {
    const prospectName = prospectMeta.prospectName || "Prospect";

    let emailBody = "";
    let whatsappBody = "";

    switch (label) {
      case "Enrollment Initiation":
        emailBody = `Hi ${prospectName},\n\nYou're successfully enrolled in our program as of ${date}. Stay tuned for the next steps.`;
        whatsappBody = emailBody;
        break;

      case "Enrollment documents mail":
        switch (status) {
          case "Documents sent":
            emailBody = `Hello ${prospectName},\n\nIt was a pleasure connecting with you. Following our discussion, we are delighted to invite you to join UJustBe as an Orbiter.\n\nAs we discussed, we would like this enrollment to be an authentic choice you make to become a part of the UJustBe Universe.\n\nTo proceed, we kindly request you to reply to this email with your approval along with the following documents:\n\n1) Professional Photo (For KYC purposes)\n2) PAN Card (For KYC purposes)\n3) Aadhar Card (For KYC purposes)\n4) Cancelled Cheque Copy (For KYC purposes and to facilitate transfer of UJustBe referral rewards)\n\nUpon receiving the required documents, the UJustBe team will guide you through the next steps of the process.`;
            whatsappBody = `Hello ${prospectName},\n\nIt was a pleasure connecting with you!\n\nAs discussed, we are happy to invite you to join UJustBe as an Orbiter.\n\nWe have shared an email with the details and next steps. Kindly check it and share requested documents at your earliest convenience.\n\nLooking forward to welcoming you into the UJustBe Universe!`;
            break;
          case "Documents pending":
            emailBody = `Hi ${prospectName},\n\nYou are just one step away from fully stepping into the UJustBe Universe and unlocking a world of possibilities, collaborations, and meaningful connections!\n\nWe noticed your enrollment documents are yet to be completed. To move forward and activate your journey, we invite you to connect with your MentOrbiter or speak with our UJustBe Support Team. They're here to walk with you and support you every step of the way.\n\nWe are excited to witness the contribution and value you’ll bring to the community. Let’s get you fully onboarded!`;
            whatsappBody = `Hi ${prospectName},\n\nYou are just one step away from becoming an Orbiter in the UJustBe Universe!\n\nSome enrollment documents are still pending-feel free to reach out to your MentOrbiter or connect with the UJustBe Support Team to complete the process.\n\nWe are here to support you and can't wait to see your journey unfold!`;
            break;
          case "Documents need revision":
            emailBody = `Hi ${prospectName},\n\nYou are just one step away from completing your enrolment in UJustBe Universe and exploring a space filled with possibilities, collaboration, and contribution!\n\nWe have noticed that your enrollment documents require a few revisions. To move forward and complete your onboarding, we invite you to connect with your MentOrbiter or the UJustBe Support Team. They are here to guide you and ensure you have everything you need to take this next step confidently.\n\nWe are excited for the unique value you’ll bring into the community. Let’s get your journey officially started!`;
            whatsappBody = `Hi ${prospectName},\n\nAs there is no response from your end we are going ahead with default option as adjustment of Enrollment fees against the referral reciprocation.\n\nWe've shared an email with the details with the process.`;
            break;
          default:
            emailBody = `Hello ${prospectName},\n\nUpdate regarding: ${label} on ${date}. Status: ${status}`;
            whatsappBody = emailBody;
        }
        break;

      case "Enrollment Fees Mail Status":
        switch (status) {
          case "Fee mail sent":
            emailBody = `Hi ${prospectName},\n\nThank you for making an authentic choice in becoming an Orbiter in the UJustBe Universe.\n\nBelow are the details regarding the one-time Orbiter Enrollment Fee:\n\nOrbiter Enrollment Fee\nAmount: Rs. 1,000 (Lifetime)\n\nYou are invited to choose one of the following payment methods:\n\nDirect Payment to UJustBe's Account:\nYou can directly transfer the enrollment fee to UJustBe’s account. Once your referral is closed, the reciprocation amount will be credited directly to your account registered with UJustBe.\n\nAdjustment from Referral Reciprocation:\nThe enrollment fee will be adjusted against your referral reciprocation. Once the adjustment is completed, subsequent referral reciprocation fees will be transferred to your account.\n\nNext Steps:\nPlease confirm your choice by replying to this email with one of the options below:\n\nOption 1: I would like to pay the Orbiter Registration Fee of Rs. 1000/- directly to UJustBe.\nOption 2: Kindly adjust the Orbiter Registration Fee from the referral reciprocation.\n\nOnce we receive your confirmation, we will send you an invoice and guide you through the next steps to complete the process.\n\nIf you have any questions or need further assistance, please feel free to reach out. We look forward to your confirmation.`;
            whatsappBody = `Hi ${prospectName},\n\nThank you for making an authentic choice to become an Orbiter in the UJustBe Universe 🌟\n\nWe have shared an email with the details of the one-time Orbiter Enrollment Fee (Rs. 1,000) and the available payment options.\n\nKindly check your email and confirm your preferred option by replying there. Once we receive your confirmation, we will guide you through the next steps.`;
            break;
          case "Fee follow-up required":
            emailBody = `Hi ${prospectName},\n\nJust following up to check in on your decision regarding the enrollment fees for joining the UJustBe Universe. This step will help activate your onboarding and open the door to powerful connections, collaborations, and opportunities aligned with your growth journey.\n\nIf you have any questions or need clarity, please feel free to speak with your MentOrbiter or connect with our UJustBe Support Team.\n\nWe are here to support you in making an empowered decision.\n\nLooking forward to welcoming you fully into the Universe!`;
            whatsappBody = `Hi ${prospectName},\n\nJust checking in to follow up on your decision regarding the enrollment fees for joining the UJustBe Universe.\n\nIf you have any questions or need support, please connect with your MentOrbiter or our UJustBe Support Team.\nWe are here to walk this journey with you!`;
            break;
          default:
            emailBody = `Hello ${prospectName},\n\nUpdate regarding: ${label} on ${date}. Status: ${status}`;
            whatsappBody = emailBody;
        }
        break;

      case "Enrollment fees Option Opted for":
        switch (status) {
          case "Upfront payment selected":
            emailBody = `Hi ${prospectName},\n\nThank you for confirming your choice to pay the Orbiter Registration Fee of Rs. 1,000/- directly to UJustBe.\n\nWe kindly request you to complete the payment and submit the payment screenshot to us within 2 working days. Please ensure the screenshot clearly mentions the transaction ID and amount for reference. You may reply to this email with the attachment or send it to support@ujustbe.com.\n\nPayment Details for Direct Transfer\nAccount Name: UJustBe Enterprise\nAccount Number: [Insert Account Number]\nBank Name: [Insert Bank Name]\nIFSC Code: [Insert IFSC Code]\n\nIf we do not receive the payment details within the stipulated time, we will automatically proceed with Option 2 (adjustment from referral reciprocation) and initiate your Orbiter journey accordingly.\n\nA separate email will be sent to confirm the adjustment and the next steps.\n\nWe look forward to your prompt response. Should you have any questions or need assistance, please do not hesitate to reach out to us.`;
            whatsappBody = `Hi ${prospectName},\n\nThank you for confirming with your option of paying Enrollment fees upfront.\n\nWe've shared an email with the details for the payment.\n\nKindly check your email and confirm once you make the payment. Once we receive your confirmation, we'll share the invoice and guide you through the next steps.\n\nLet us know if you need any help! !`;
            break;
          case "Adjustment selected":
            emailBody = `Hi ${prospectName},\n\nThank you for confirming your choice to adjust the Orbiter Registration Fee of Rs. 1,000/- from your referral reciprocation.\n\nWe have noted your preference and will proceed accordingly. The enrollment fee will be deducted from the referral reciprocation, and the remaining balance will be transferred to your registered account as per the standard timelines.\n\nYour Orbiter journey in the UJustBe Universe has now officially begun. We are happy to have you as part of UJustBe Universe and look forward to your active participation.\n\nShould you have any questions or need further assistance, please feel free to reach out to us. We are here to support you in every step of your journey.`;
            whatsappBody = `Hi ${prospectName},\n\nThank you for confirming with your option of Adjustment of your one time enrolment fees against the referral reciprocation.\n\nKindly check your email and allow us to guide you through the next steps.\n\nLet us know if you need any help!`;
            break;
          case "No response - adjustment applied":
            emailBody = `Hi ${prospectName},\n\nWe hope this email finds you well.\n\nSince we have not received the payment screenshot for the Orbiter Registration Fee of Rs. 1,000/- within the stipulated 2 working days, we have proceeded with Option 2: adjustment of the enrollment fee from your referral reciprocation.\n\nYour Orbiter journey in the UJustBe Universe has now been initiated. The enrollment fee will be deducted from your referral reciprocation, and any subsequent referral reciprocation amounts will be credited directly to your registered account as per standard timelines.\n\nIf you have any questions or require further assistance, please feel free to reach out to us. We are excited to have you as part of the UJustBe Universe and look forward to your active participation in our community.`;
            whatsappBody = `Hi ${prospectName},\n\nAs there is no response from your end we are going ahead with default option as adjustment of Enrollment fees against the referral reciprocation.\n\nWe've shared an email with the details with the process.`;
            break;
          case "Upfront payment confirmed":
            emailBody = `Hi ${prospectName},\n\nWe are pleased to confirm that we have received your payment of Rs. 1,000/- towards the Orbiter Enrollment Fee. Thank you for completing this step to officially begin your journey in the UJustBe Universe.\n\nYour payment has been successfully processed, and we are excited to have you as an active Orbiter in our community. You will soon receive further communication regarding the next steps and how you can start contributing, connecting, and growing with the UJustBe Universe.\n\nShould you have any questions or need assistance, please feel free to reach out to us. Once again, welcome aboard!`;
            whatsappBody = `Hi ${prospectName},\n\nThank you for making the payment towards the One time Enrollment fees - Upfront\n\nWe've shared an email with the details with the process.`;
            break;
          default:
            emailBody = `Hi ${prospectName},\n\nYou've opted for ${status} as your payment method. If any change is needed, please let us know.`;
            whatsappBody = emailBody;
        }
        break;

      case "Enrollments Completion Status":
        switch (status) {
          case "Enrollment completed":
            emailBody = `Dear ${prospectName},\n\nWelcome to the UJustBe Universe!\n\nThank you for making the authentic choice to become an Orbiter in this thriving community. We are delighted to have you join us on this exciting journey. Below is an overview of your journey path within the UJustBe Universe:\n\n- Orbiter – Your initiation into the UJustBe Universe, where meaningful relationships begin to form, holistic health is nurtured, and the foundation of wealth is laid through connections and growth.\n\n- Monthly Meeting Journey – Participate in interactive monthly meetings designed to strengthen relationships, enhance emotional and mental well-being, and provide insights for personal and professional wealth-building.\n\n- Referral Journey – Share genuine referrals with CosmOrbiters to expand opportunities, build trust within the Universe, and cultivate mutual growth.\n\n- Active Orbiter – Take an active role in the Universe through consistent engagement, nurturing deeper relationships, maintaining personal well-being, and creating pathways for sustainable wealth.\n\n- CosmOrbiter – Elevate your journey by listing your business or profession, leveraging the UJustBe network to expand opportunities and build professional relationships.\n\n- Accelerated Orbiter – Blend the power of authentic referrals and active participation in UJustBe events to accelerate your journey, unlock new opportunities, and strengthen community bonds.\n\n- CCAO (Consistent Contributing Active Orbiter) – Achieve this status through regular contributions that enrich relationships, foster a balanced lifestyle, and drive meaningful impact.\n\n- MentOrbiter – Lead by inviting and enrolling your network. Empower them to build fulfilling relationships, nurture well-being, and create wealth through the UJustBe Universe.\n\nThis journey invites you to embrace a balanced approach to life, uniting Relationship, Health, and Wealth to create a fulfilling experience within the UJustBe Universe.\n\nTo support you, our dedicated Support Team, Nucleus Team, and your MentOrbiter ([Name of MentOrbiter]) will guide and assist you every step of the way.\n\nWe are excited to see your growth and contributions. Let's create meaningful connections and experiences together!\n\nIf you have any questions or need assistance, please feel free to reach out to us.`;
            whatsappBody = `Dear ${prospectName},\n\n Welcome to the UJustBe Universe! \n\n              We are happy to welcome you as an Orbiter in the UJustBe Universe! \n              \n              Your journey here is about building meaningful relationships, nurturing holistic health, and creating wealth through shared growth.\n              \n              Start with: \n            Monthly Meetings \n              Identifying authentic referrals \n              Engaging actively in the community \n              Growing into roles like CosmOrbiter, Accelerated Orbiter, MentOrbiter & more!\n              \n              You'll be supported by your MentOrbiter and our Support & Nucleus Team throughout the way. \n              \n              Please check your mail for more details.`;
            break;
          case "Enrollment withdrawn":
            emailBody = `Hi ${prospectName},\n\nWe wanted to let you know that we have received your decision to withdraw from the UJustBe enrollment process at this time.\n\nWhile we understand and respect your decision, please know that we are always here for you. If you ever choose to reconsider or would like to explore the benefits of rejoining, feel free to reach out. Your journey with us is important, and we're always ready to support your growth when the time is right.\n\nThank you for considering UJustBe, and we hope to have the opportunity to welcome you back in the future.`;
            whatsappBody = `Hi ${prospectName},\n\nWe have noted that you have decided to withdraw from the enrollment process for now.\n\nIf you ever choose to reconsider or need more details, we're here to support you whenever you're ready.\n\nThank you for considering UJustBe, and we hope to reconnect in the future!`;
            break;
          default:
            emailBody = `Hello ${prospectName},\n\nUpdate regarding: ${label} on ${date}. Status: ${status}`;
            whatsappBody = `Hi ${prospectName},\n\nYour Status is ${status}. If any change is needed, please let us know.`;
        }
        break;

      default:
        emailBody = `Hello ${prospectName},\n\nUpdate regarding: ${label} on ${date}. Status: ${status}`;
        whatsappBody = emailBody;
    }

    return { emailBody, whatsappBody };
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const unlocked = isRowUnlocked(index);

        if (!unlocked && (row.checked || row.date || row.status || row.sent)) {
          throw new Error(`Complete the previous step before updating "${row.label}".`);
        }

        if (row.checked && (!row.date || !row.status)) {
          throw new Error(`Complete date and status for "${row.label}".`);
        }
      }

      const responseData = await persistRows(rows, "save");
      const orbiterConversion = responseData?.orbiterConversion || null;

      if (orbiterConversion?.status === "created") {
        Swal.fire(
          "User Is Now An Orbiter",
          `This user is now an orbiter.${orbiterConversion.ujbCode ? ` UJB ID: ${orbiterConversion.ujbCode}.` : ""}`,
          "success"
        );
      } else if (orbiterConversion?.status === "already_orbiter") {
        Swal.fire(
          "Already Orbiter",
          `This prospect is already present as an orbiter${orbiterConversion.ujbCode ? ` (${orbiterConversion.ujbCode})` : ""}.`,
          "info"
        );
      } else {
        Swal.fire("Saved!", "Enrollment stages have been saved.", "success");
      }
      fetchData?.();
    } catch (err) {
      console.error("Error saving enrollment stages:", err);
      Swal.fire("Error", err.message || "Failed to save changes.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (index) => {
    const row = rows[index];

    if (!canSend(row, index)) {
      Swal.fire("Incomplete step", "Please complete and save this step first.", "warning");
      return;
    }

    try {
      setLoading(true);

      const { emailBody, whatsappBody } = buildStageMessages(
        row.label,
        row.status,
        row.date
      );

      if (prospectMeta.email) {
        await emailjs.send(
          "service_acyimrs",
          "template_cdm3n5x",
          {
            to_email: prospectMeta.email,
            prospect_name: prospectMeta.prospectName || "Prospect",
            body: emailBody,
          },
          "w7YI9DEqR9sdiWX9h"
        );
      }

      if (prospectMeta.prospectPhone) {
        await sendWhatsAppTemplateRequest({
          phone: prospectMeta.prospectPhone,
          templateName: "enrollment_journey",
          parameters: [
            sanitizeText(whatsappBody),
            sanitizeText(prospectMeta.orbiterName),
          ],
        });
      }

      const nextRows = rows.map((currentRow, rowIndex) =>
        rowIndex === index ? { ...currentRow, sent: true } : currentRow
      );

      await persistRows(nextRows, "send_email", row.label, {
        status: row.status,
        date: row.date,
        label: row.label,
      });

      Swal.fire("Sent!", `Notification sent for "${row.label}".`, "success");
    } catch (err) {
      console.error("Error sending enrollment update:", err);
      Swal.fire("Error", "Failed to send update.", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmAndSendEmail = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to send the email and WhatsApp update?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, send it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSendEmail(index);
      }
    });
  };

  const confirmAndSave = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to save the changes?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, save it!",
    }).then((result) => {
      if (result.isConfirmed) {
        handleSave();
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white border rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Enrollment Status Updates</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700 text-sm">
              <tr>
                <th className="px-4 py-3 text-left border-b">Check</th>
                <th className="px-4 py-3 text-left border-b">Stage</th>
                <th className="px-4 py-3 text-left border-b">Date</th>
                <th className="px-4 py-3 text-left border-b">Status</th>
                <th className="px-4 py-3 text-left border-b">Send Email</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {rows.map((row, index) => {
                const unlocked = isRowUnlocked(index);

                return (
                  <tr
                    key={row.label}
                    className={`border-b ${unlocked ? "hover:bg-gray-50" : "bg-slate-50 text-slate-400"
                      }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        disabled={!unlocked || loading}
                        onChange={(e) =>
                          handleChange(index, "checked", e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                    </td>

                    <td className="px-4 py-3 font-medium">{row.label}</td>

                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={row.date}
                        disabled={!unlocked || !row.checked || loading}
                        onChange={(e) => handleChange(index, "date", e.target.value)}
                        className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-slate-100"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={row.status}
                        disabled={!unlocked || !row.checked || loading}
                        onChange={(e) => handleChange(index, "status", e.target.value)}
                        className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-black disabled:bg-slate-100"
                      >
                        <option value="">Select</option>
                        {(STAGE_OPTIONS.find((stage) => stage.label === row.label)?.statuses || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => confirmAndSendEmail(index)}
                        disabled={!canSend(row, index) || loading}
                        className="bg-black text-white px-4 py-1 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                      >
                        {getSendLabel(row)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={confirmAndSave}
            disabled={loading}
            className={`px-5 py-2 rounded-lg text-white transition ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"
              }`}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Action Log</h3>

          {logs.length === 0 ? (
            <p className="text-gray-500">No actions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {[...logs].reverse().map((log, index) => (
                <div
                  key={getLogKey(log, index)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="font-medium">{getLogTitle(log)}</p>

                  <p className="text-sm text-slate-600">
                    <span className="font-medium">By:</span> {log.clickedBy || "Admin"}
                    {" · "}
                    <span className="font-medium">At:</span>{" "}
                    {formatLogDate(log.clickedAt)}
                  </p>

                  {log.status && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Selected status:</span> {log.status}
                    </p>
                  )}

                  {log.date && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Date:</span> {formatStageDate(log.date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentStage;
