import BirthdayEditClient from "@/components/admin/birthday/BirthdayEditClient";

export default function BirthdayEditPage({ params }) {
  return <BirthdayEditClient id={params.id} />;
}
