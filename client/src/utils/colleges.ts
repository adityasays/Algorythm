/**
 * Full college names, used in registration form.
 */
export const COLLEGES = [
  "Indian Institute of Technology, Bombay",
  "Indian Institute of Technology, Delhi",
  "Indian Institute of Technology, Madras",
  "Indian Institute of Technology, Kanpur",
  "Indian Institute of Technology, Kharagpur",
  "Indian Institute of Science, Bangalore",
  "National Institute of Technology, Trichy",
  "National Institute of Technology, Surathkal",
  "Delhi Technological University",
  "Birla Institute of Technology and Science, Pilani",
  "Vellore Institute of Technology",
  "College of Engineering, Pune",
  "PSG College of Technology",
  "Anna University",
  "Mumbai University",
  "Delhi University",
  "Jadavpur University",
  "Manipal Institute of Technology",
  "Chennai Mathematical Institute",
  "International Institute of Information Technology, Hyderabad",
  "SRM Institute of Science and Technology",
  "Amrita Vishwa Vidyapeetham",
  "PES University",
  "Thapar Institute of Engineering and Technology",
  "Chandigarh University",
  "Visvesvaraya National Institute of Technology",
  "R.V. College of Engineering",
  "B.M.S. College of Engineering"
];

/**
 * URL-friendly aliases for colleges, used in leaderboard API requests.
 */
export const COLLEGE_ALIASES = [
  "IITBombay",
  "IITDelhi",
  "IITMadras",
  "IITKanpur",
  "IITKharagpur",
  "IIScBangalore",
  "NITTrichy",
  "NITSurathkal",
  "DTUDelhi",
  "BITSPilani",
  "VITVellore",
  "COEPune",
  "PSGTech",
  "AnnaUniv",
  "MumbaiUniv",
  "DelhiUniv",
  "JadavpurUniv",
  "ManipalTech",
  "CMIChennai",
  "IIITHyderabad",
  "SRMIST",
  "AmritaVishwa",
  "PESUniv",
  "ThaparTech",
  "ChandigarhUniv",
  "VNITNagpur",
  "RVCE",
  "BMSCE"
];

/**
 * Mapping from aliases to full college names.
 */
export const ALIAS_TO_FULL_NAME: { [key: string]: string } = {
  IITBombay: "Indian Institute of Technology, Bombay",
  IITDelhi: "Indian Institute of Technology, Delhi",
  IITMadras: "Indian Institute of Technology, Madras",
  IITKanpur: "Indian Institute of Technology, Kanpur",
  IITKharagpur: "Indian Institute of Technology, Kharagpur",
  IIScBangalore: "Indian Institute of Science, Bangalore",
  NITTrichy: "National Institute of Technology, Trichy",
  NITSurathkal: "National Institute of Technology, Surathkal",
  DTUDelhi: "Delhi Technological University",
  BITSPilani: "Birla Institute of Technology and Science, Pilani",
  VITVellore: "Vellore Institute of Technology",
  COEPune: "College of Engineering, Pune",
  PSGTech: "PSG College of Technology",
  AnnaUniv: "Anna University",
  MumbaiUniv: "Mumbai University",
  DelhiUniv: "Delhi University",
  JadavpurUniv: "Jadavpur University",
  ManipalTech: "Manipal Institute of Technology",
  CMIChennai: "Chennai Mathematical Institute",
  IIITHyderabad: "International Institute of Information Technology, Hyderabad",
  SRMIST: "SRM Institute of Science and Technology",
  AmritaVishwa: "Amrita Vishwa Vidyapeetham",
  PESUniv: "PES University",
  ThaparTech: "Thapar Institute of Engineering and Technology",
  ChandigarhUniv: "Chandigarh University",
  VNITNagpur: "Visvesvaraya National Institute of Technology",
  RVCE: "R.V. College of Engineering",
  BMSCE: "B.M.S. College of Engineering"
};