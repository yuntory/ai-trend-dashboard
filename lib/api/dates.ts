const TIME_ZONE = "Asia/Seoul";

export function getKstDateString(offsetDays = 0) {
  const kstDate = new Date(new Date().toLocaleString("en-US", { timeZone: TIME_ZONE }));
  kstDate.setDate(kstDate.getDate() + offsetDays);

  const year = kstDate.getFullYear();
  const month = String(kstDate.getMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
