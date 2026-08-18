export const CLASSES = [
  "Primary 1","Primary 2","Primary 3","Primary 4","Primary 5","Primary 6",
  "JSS1","JSS2","JSS3","SS1","SS2","SS3"
];

export const SUBJECTS = [
  "Mathematics","English Language","Computer Science","Basic Science",
  "Social Studies","Civic Education","Economics","Physics","Chemistry",
  "Biology","Literature","Geography","Agricultural Science","Fine Art"
];

export const TERMS = ["1st Term","2nd Term","3rd Term"];

export function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
