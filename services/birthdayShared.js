export function getFormattedDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

export function parseDobInput(dob) {
  if (!dob) return null;

  if (typeof dob === "string" && dob.includes("/")) {
    const [day, month, year] = dob.split("/");
    return new Date(`${year}-${month}-${day}`);
  }

  return new Date(dob);
}

export function getBirthdayDobInfo(dob) {
  const birthDate = parseDobInput(dob);

  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }

  return {
    age: nextBirthday.getFullYear() - birthDate.getFullYear(),
    day: nextBirthday.toLocaleDateString("en-US", {
      weekday: "long",
    }),
  };
}
