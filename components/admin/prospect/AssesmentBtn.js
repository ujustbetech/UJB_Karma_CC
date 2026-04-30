import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, db } from "@/services/adminProspectJourneyFirebaseService";

import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";
import { COLLECTIONS } from "@/lib/utility_collection";
import { sendWhatsAppTemplateRequest } from "@/utils/whatsappClient";

const Assessment = ({ id, fetchData }) => {

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [reason, setReason] = useState("");

  const isFrozen = loading || (status && status !== "No status yet");

  /* ------------------------------------------------ */
  /* FETCH ASSESSMENT STATUS */
  /* ------------------------------------------------ */

  useEffect(() => {

    const fetchStatus = async () => {

      try {

        const docRef = doc(db, COLLECTIONS.prospect, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

          const data = docSnap.data();

          setStatus(data.assessmentStatus || "No status yet");
          setReason(data.assessmentReason || "");

        }

      } catch (error) {

        console.error("Error fetching status:", error);

      }

    };

    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    setCurrentDate(today);

    fetchStatus();

  }, [id]);

  /* ------------------------------------------------ */
  /* HELPERS */
  /* ------------------------------------------------ */

  const sanitizeText = (text) => {
    return text?.replace(/[^a-zA-Z0-9 .,!?'"@#&()\-]/g, " ") || "";
  };

  /* ------------------------------------------------ */
  /* SEND WHATSAPP */
  /* ------------------------------------------------ */

  const sendWhatsapp = async (prospectName, orbiterName, message, phone) => {

    try {

      await sendWhatsAppTemplateRequest({
        phone,
        templateName: "enrollment_journey",
        parameters: [
          sanitizeText(message),
          sanitizeText(orbiterName),
        ],
      });

      console.log("Whatsapp sent");

    } catch (error) {

      console.error("Whatsapp failed", error);

    }

  };

  /* ------------------------------------------------ */
  /* SEND EMAIL */
  /* ------------------------------------------------ */

  const sendEmail = async (
    prospectName,
    prospectEmail,
    orbiterName,
    selectedstatus
  ) => {

    const body = `Dear ${prospectName},

Your Day 16 assessment status is:

${selectedstatus}

Regards,
UJustBe Team`;

    const templateParams = {
      prospect_name: prospectName,
      to_email: prospectEmail,
      body,
      orbiter_name: orbiterName
    };

    try {

      await emailjs.send(
        "service_acyimrs",
        "template_cdm3n5x",
        templateParams,
        "w7YI9DEqR9sdiWX9h"
      );

    } catch (error) {

      console.error("Email error", error);

    }

  };

  /* ------------------------------------------------ */
  /* SAVE ASSESSMENT */
  /* ------------------------------------------------ */

  const handleSaveStatus = async (selectedstatus, reasonText = "") => {

    setLoading(true);

    try {

      const docRef = doc(db, COLLECTIONS.prospect, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const data = docSnap.data();

      const updateData = {
        assessmentStatus: selectedstatus,
        assessmentReason: reasonText,
        assessmentDate: currentDate
      };

      /* START JOURNEY */

      if (selectedstatus === "Completed 80%") {

        updateData.journeyStage = "Day17";

      }

      await updateDoc(docRef, updateData);

      setStatus(selectedstatus);

      const prospectName = data.prospectName;
      const prospectEmail = data.email;
      const prospectPhone = data.prospectPhone;
      const orbiterName = data.orbiterName;

      const message =
        `Hello ${prospectName}, your Day 16 assessment result is: ${selectedstatus}. Please check your email for details.`;

      await sendEmail(
        prospectName,
        prospectEmail,
        orbiterName,
        selectedstatus
      );

      await sendWhatsapp(
        prospectName,
        orbiterName,
        message,
        prospectPhone
      );

      Swal.fire({
        icon: "success",
        title: "Assessment Saved",
        text: "Email and WhatsApp notification sent"
      });

      fetchData?.();

    } catch (error) {

      console.error(error);

    }

    setLoading(false);

  };

  /* ------------------------------------------------ */
  /* CONFIRMATION */
  /* ------------------------------------------------ */

  const confirmSaveStatus = (newStatus) => {

    if (
      newStatus === "Not aligned yet" ||
      newStatus === "Cannot align with UJustBe"
    ) {

      Swal.fire({
        title: "Add Reason",
        input: "textarea",
        inputPlaceholder: "Enter reason",
        showCancelButton: true,
        confirmButtonText: "Submit",
        preConfirm: (value) => {
          if (!value) {
            Swal.showValidationMessage("Reason required");
          }
          return value;
        }
      }).then((result) => {

        if (result.isConfirmed) {

          handleSaveStatus(newStatus, result.value);

        }

      });

    } else {

      Swal.fire({
        title: "Confirm",
        text: `Set status as "${newStatus}"?`,
        icon: "warning",
        showCancelButton: true
      }).then((result) => {

        if (result.isConfirmed) {

          handleSaveStatus(newStatus);

        }

      });

    }

  };

  /* ------------------------------------------------ */
  /* UI */
  /* ------------------------------------------------ */

  return (

    <div className="max-w-4xl mx-auto p-6">

      <div className="bg-white border rounded-xl shadow-sm p-6">

        <h2 className="text-xl font-semibold mb-4">
          Day 16 – Assessment
        </h2>

        <h3 className="text-lg mb-2">

          Status:{" "}
          <span className="font-medium">

            {status || "No status yet"}

          </span>

        </h3>

        {reason && (

          <p className="mt-2 text-red-700 italic bg-red-50 border p-3 rounded-lg">
            Reason: {reason}
          </p>

        )}

        <p className="text-gray-700 mt-4 mb-4">

          Date: {currentDate}

        </p>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => confirmSaveStatus("Not aligned yet")}
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Not aligned yet
          </button>

          <button
            onClick={() =>
              confirmSaveStatus("Cannot align with UJustBe")
            }
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Cannot align with UJustBe
          </button>

          <button
            onClick={() =>
              confirmSaveStatus("Completed 80%")
            }
            disabled={isFrozen}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
          >
            Completed 80% – Continue Journey
          </button>

        </div>

      </div>

    </div>

  );

};

export default Assessment;



