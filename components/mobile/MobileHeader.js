"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebaseClient";
import { Coins, Bell, User, LogOut, Receipt } from "lucide-react";
import useUserNotifications from "@/hooks/useUserNotifications";

export default function MobileHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [cpPoints, setCPPoints] = useState(0);
  const [userCategory, setUserCategory] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const { unreadCount } = useUserNotifications(user);

  useEffect(() => {
    if (!user?.profile?.ujbCode) return;

    let docTotal = null;
    let activityTotal = 0;

    const applyTotal = () => {
      setCPPoints(docTotal ?? activityTotal);
    };

    const boardRef = doc(db, "CPBoard", user.profile.ujbCode);
    const activitiesRef = collection(boardRef, "activities");

    const unsubscribeBoard = onSnapshot(
      boardRef,
      (snap) => {
        const totals = snap.data()?.totals;
        const nextDocTotal =
          totals && typeof totals === "object"
            ? Object.values(totals).reduce(
                (sum, value) => sum + (Number(value) || 0),
                0
              )
            : null;

        docTotal = nextDocTotal;
        applyTotal();
      },
      () => {
        docTotal = null;
        applyTotal();
      }
    );

    const unsubscribeActivities = onSnapshot(
      activitiesRef,
      (snap) => {
        activityTotal = snap.docs.reduce(
          (sum, docSnap) => sum + (Number(docSnap.data()?.points) || 0),
          0
        );
        applyTotal();
      },
      () => {
        activityTotal = 0;
        applyTotal();
      }
    );

    return () => {
      unsubscribeBoard();
      unsubscribeActivities();
    };
  }, [user]);

  useEffect(() => {
    if (!user?.profile?.ujbCode) return;

    const fetchUserDetails = async () => {
      try {
        const userRef = doc(db, "usersdetail", user.profile.ujbCode);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();
          setUserCategory(data?.Category || "Member");
          setProfileImage(data?.ProfilePhotoURL || "");
          return;
        }
      } catch {}

      setUserCategory("Member");
      setProfileImage("");
    };

    fetchUserDetails();
  }, [user]);

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
      : "";

  if (!user) return null;

  const userName = user?.profile?.name || "User";
  const ujbCode = user?.profile?.ujbCode;

  return (
    <>
      <header className="h-16 flex items-center justify-between px-4 backdrop-blur-md bg-black/60 border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <img src="/ujustlogo.png" alt="Logo" className="h-7 object-contain" />

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{userName}</span>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400">{ujbCode}</span>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-400/20">
                {userCategory}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            onClick={() => router.push("/user/notifications")}
            className="relative cursor-pointer transition hover:scale-110"
          >
            <Bell size={20} className="text-slate-300" />
            {unreadCount > 0 ? (
              <span className="absolute -top-2 -right-2 min-w-[18px] rounded-full border border-black bg-orange-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </div>

          <button
            onClick={() => router.push("/user/contribuitionpoint")}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-400/20 text-orange-400 transition active:scale-95"
          >
            <Coins size={16} />
            {cpPoints}
          </button>

          <div
            onClick={() => setShowProfileMenu(true)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-xs font-semibold cursor-pointer shadow-md transition active:scale-95"
          >
            {getInitials(userName)}
          </div>
        </div>
      </header>

      {showProfileMenu && (
        <div
          className="fixed inset-0 z-99 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-2xl p-6 animate-slideUp"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="mb-6 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(event) => (event.target.style.display = "none")}
                  />
                ) : (
                  <User size={20} className="text-gray-500" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {userName}{" "}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-400/20">
                    {userCategory}
                  </span>
                </h3>

                <p className="text-xs text-gray-500">{ujbCode}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  router.push("/user/profile");
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-3 w-full py-2 text-left text-gray-700 hover:text-orange-500 transition"
              >
                <User size={18} />
                View Profile
              </button>

              <button
                onClick={() => {
                  router.push("/user/contribuitionpoint");
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-3 w-full py-2 text-left text-gray-700 hover:text-orange-500 transition"
              >
                <Coins size={18} />
                CP Details
              </button>

              <button
                onClick={() => {
                  router.push("/user/redeem");
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-3 w-full py-2 text-left text-gray-700 hover:text-orange-500 transition"
              >
                <Coins size={18} />
                Redeem Request
              </button>

              <button
                onClick={() => {
                  router.push("/user/payments");
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-3 w-full py-2 text-left text-gray-700 hover:text-orange-500 transition"
              >
                <Receipt size={18} />
                My Payments
              </button>

              <button
                onClick={() => {
                  router.push("/user/notifications");
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-3 w-full py-2 text-left text-gray-700 hover:text-orange-500 transition"
              >
                <Bell size={18} />
                Notifications
              </button>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-3 w-full py-2 text-left text-red-500 hover:text-red-600 transition"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
