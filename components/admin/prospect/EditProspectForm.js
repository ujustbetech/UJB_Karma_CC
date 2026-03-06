"use client";

import { useState, useEffect } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utility_collection";

const Edit = ({ id, data }) => {

  const [phone, setPhone] = useState(data?.orbiterContact || "");
  const [name, setName] = useState(data?.orbiterName || "");
  const [orbiteremail, setOrbiterEmail] = useState(data?.orbiterEmail || "");
  const [type, setType] = useState(data?.type || "");
  const [prospectName, setProspectName] = useState(data?.prospectName || "");
  const [prospectPhone, setProspectPhone] = useState(data?.prospectPhone || "");
  const [occupation, setOccupation] = useState(data?.occupation || "");
  const [hobbies, setHobbies] = useState(data?.hobbies || "");
  const [email, setEmail] = useState(data?.email || "");

  const getNowForDateTimeLocal = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  };

  const [date, setDate] = useState(getNowForDateTimeLocal());

  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userList, setUserList] = useState([]);

  const formatReadableDate = (inputDate) => {
    const d = new Date(inputDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "long" });
    const year = String(d.getFullYear()).slice(-2);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${day} ${month} ${year} at ${hours}.${minutes} ${ampm}`;
  };

  /* FETCH USERS */

  useEffect(() => {

    const fetchUsers = async () => {

      try {

        const userRef = collection(db, COLLECTIONS.userDetail);

        const snapshot = await getDocs(userRef);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data()["Name"],
          phone: doc.data()["MobileNo"],
          Email: doc.data()["Email"],
        }));

        setUserList(data);

      } catch (error) {
        console.error("Error fetching users:", error);
      }

    };

    fetchUsers();

  }, []);

  /* SEARCH USER */

  const handleSearchUser = (e) => {

    const value = e.target.value.toLowerCase();

    setUserSearch(value);

    const filtered = userList.filter(
      (user) => user.name && user.name.toLowerCase().includes(value)
    );

    setFilteredUsers(filtered);
  };

  const handleSelectUser = (user) => {

    setName(user.name);
    setPhone(user.phone);
    setOrbiterEmail(user.Email);

    setUserSearch("");
    setFilteredUsers([]);
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
  };

  /* SUBMIT */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      !name ||
      !phone ||
      !orbiteremail ||
      !type ||
      !prospectName ||
      !prospectPhone ||
      !occupation ||
      !email ||
      !hobbies
    ) {
      alert("Please fill all fields");
      return;
    }

    try {

      const formattedDate = formatReadableDate(date);
      const realTimestamp = new Date(date);

      const prospectDocRef = doc(db, COLLECTIONS.prospect, id);

      await updateDoc(prospectDocRef, {

        orbiterName: name,
        orbiterContact: phone,
        orbiterEmail: orbiteremail,
        type,
        prospectName,
        prospectPhone,
        occupation,
        hobbies,
        email,

        date: formattedDate,
        submittedAt: realTimestamp,
        updatedAt: new Date(),
      });

      alert("Prospect updated successfully");

    } catch (error) {

      console.error("Error updating user:", error);
      alert("Error updating user");

    }
  };

  /* UI */

  return (

    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

      <h2 className="text-xl font-semibold mb-6">
        {prospectName}'s Details
      </h2>

      <form className="space-y-6">

        {/* ORBITER SEARCH */}

        <div>

          <label className="block text-sm font-medium mb-2">
            Select Orbiter *
          </label>

          <input
            type="text"
            placeholder="Search Orbiter"
            value={userSearch}
            onChange={handleSearchUser}
            className="w-full border rounded-lg px-3 py-2"
          />

          {filteredUsers.length > 0 && (

            <div className="border rounded-lg mt-2 bg-white shadow">

              {filteredUsers.map((user) => (

                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="px-3 py-2 hover:bg-slate-100 cursor-pointer"
                >
                  {user.name}
                </div>

              ))}

            </div>

          )}

        </div>

        {/* ORBITER DETAILS */}

        <div className="grid grid-cols-3 gap-4">

          <div>
            <label className="text-sm font-medium">Orbiter Name</label>
            <p className="mt-1 text-slate-700">{name}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Orbiter Phone</label>
            <p className="mt-1 text-slate-700">{phone}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Orbiter Email</label>
            <p className="mt-1 text-slate-700">{orbiteremail}</p>
          </div>

        </div>

        {/* PROSPECT DETAILS */}

        <div className="grid grid-cols-2 gap-4">

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Prospect Name"
            value={prospectName}
            onChange={(e) => setProspectName(e.target.value)}
          />

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Prospect Phone"
            value={prospectPhone}
            onChange={(e) => setProspectPhone(e.target.value)}
          />

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
          />

          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Hobbies"
            value={hobbies}
            onChange={(e) => setHobbies(e.target.value)}
          />

        </div>

        {/* TYPE */}

        <div>

          <label className="block text-sm font-medium mb-2">
            Occasion for Intimation
          </label>

          <select
            value={type}
            onChange={handleTypeChange}
            className="w-full border rounded-lg px-3 py-2"
          >

            <option value="support_call">Support Team Call</option>
            <option value="orbiter_connection">Orbiter Connect</option>
            <option value="doorstep_service">Doorstep Service</option>
            <option value="monthly_meeting">Monthly Meeting</option>
            <option value="e2a_interactions">E2A Interaction</option>
            <option value="unniversary_interactions">Unniversary Interaction</option>
            <option value="support">Support</option>
            <option value="nt">NT</option>
            <option value="management">Management</option>

          </select>

        </div>

        {/* BUTTON */}

        <div className="flex justify-end">

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Update Prospect
          </button>

        </div>

      </form>

    </div>

  );
};

export default Edit;