"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { COLLECTIONS } from "@/lib/utility_collection";

import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import ActionButton from "@/components/ui/ActionButton";
import Tooltip from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/ToastProvider";
import { Trash2, Plus } from "lucide-react";

export default function KnowledgeSharingSection({
  conclaveId,
  meetingId,
  data = {},
  fetchData,
}) {
  const toast = useToast();

  const [knowledgeSections, setKnowledgeSections] = useState(
    data.knowledgeSections || []
  );
  const [userList, setUserList] = useState([]);
  const [filteredUsersMap, setFilteredUsersMap] = useState({});

  /* ================= FETCH USERS ================= */

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userRef = collection(db, COLLECTIONS.userDetail);
        const snapshot = await getDocs(userRef);

        const users = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().Name || "",
        }));

        setUserList(users);
      } catch {
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, []);

  /* ================= SEARCH ================= */

  const handleSearchChange = (index, value) => {
    setKnowledgeSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, search: value } : section
      )
    );

    const filtered = userList.filter((user) =>
      user.name.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredUsersMap((prev) => ({
      ...prev,
      [index]: filtered,
    }));
  };

  const handleSelectName = (index, name) => {
    setKnowledgeSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, name, search: "" } : section
      )
    );

    setFilteredUsersMap((prev) => ({
      ...prev,
      [index]: [],
    }));
  };

  /* ================= FIELD CHANGE ================= */

  const handleFieldChange = (index, field, value) => {
    setKnowledgeSections((prev) =>
      prev.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    );
  };

  /* ================= ADD ================= */

  const handleAddSection = () => {
    setKnowledgeSections((prev) => [
      ...prev,
      { name: "", search: "", topic: "", description: "" },
    ]);
  };

  /* ================= REMOVE ================= */

  const handleRemoveSection = (index) => {
    setKnowledgeSections((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= SAVE ================= */

  const handleSaveSections = async () => {
    try {
      const ref = doc(
        db,
        COLLECTIONS.conclaves,
        conclaveId,
        "meetings",
        meetingId
      );

      const cleaned = knowledgeSections.map(
        ({ name, topic, description }) => ({
          name,
          topic,
          description,
        })
      );

      await updateDoc(ref, { knowledgeSections: cleaned });

      toast.success("Knowledge sections saved");
      fetchData?.();
    } catch {
      toast.error("Failed to save");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      <Card>
        <div className="flex justify-between items-center">
          <Text variant="h2">Knowledge Sharing</Text>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddSection}
          >
            <Plus size={16} />
            Add
          </Button>
        </div>
      </Card>

      {knowledgeSections.map((section, index) => (
        <Card key={index} className="space-y-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <Text variant="h3">
              Entry {index + 1}
            </Text>

            <Tooltip content="Remove">
              <ActionButton
                icon={Trash2}
                variant="danger"
                onClick={() => handleRemoveSection(index)}
              />
            </Tooltip>
          </div>

          {/* Name */}
          <FormField label="Orbiter Name" required>
            <div className="relative">
              <Input
                placeholder="Search Orbiter"
                value={section.search || section.name}
                onChange={(e) =>
                  handleSearchChange(index, e.target.value)
                }
              />

              {filteredUsersMap[index]?.length > 0 && (
                <div className="absolute bg-white border rounded-md shadow-md mt-1 w-full max-h-40 overflow-y-auto z-20">
                  {filteredUsersMap[index].map((user) => (
                    <div
                      key={user.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() =>
                        handleSelectName(index, user.name)
                      }
                    >
                      {user.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {/* Topic */}
          <FormField label="Topic" required>
            <Input
              value={section.topic}
              onChange={(e) =>
                handleFieldChange(index, "topic", e.target.value)
              }
            />
          </FormField>

          {/* Description */}
          <FormField label="Description" required>
            <Textarea
              value={section.description}
              onChange={(e) =>
                handleFieldChange(index, "description", e.target.value)
              }
            />
          </FormField>

        </Card>
      ))}

      {knowledgeSections.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSaveSections}>
            Save Changes
          </Button>
        </div>
      )}

    </div>
  );
}

