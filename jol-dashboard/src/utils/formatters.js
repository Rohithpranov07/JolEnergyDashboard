export const fmtINR = (n) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const fmtUSD = (n) =>
  "$" + Math.round(n).toLocaleString("en-US");

export const fmtKg = (n) =>
  n >= 1000 ? (n / 1000).toFixed(1) + " T" : Math.round(n) + " kg";

export const fmtDaysAgo = (n) =>
  n === 0 ? "Today" : n === 1 ? "Yesterday" : n + " days ago";

export const stageColor = (stage) =>
  ({
    Lead:               { bg: "#E6F1FB", text: "#0C447C" },
    Contacted:          { bg: "#EAF3DE", text: "#27500A" },
    Qualified:          { bg: "#FEF3C7", text: "#B45309" },
    Interested:         { bg: "#FAEEDA", text: "#633806" },
    "LOI Received":     { bg: "#E1F5EE", text: "#085041" },
    "Sample Requested": { bg: "#EEEDFE", text: "#3C3489" },
    Discussion:         { bg: "#FAECE7", text: "#712B13" },
  }[stage] || { bg: "#F1EFE8", text: "#444441" });

export const interestColor = (lvl) =>
  ({
    High:   { bg: "#EAF3DE", text: "#27500A" },
    Medium: { bg: "#FEF3C7", text: "#B45309" },
    Low:    { bg: "#FCEBEB", text: "#791F1F" },
  }[lvl] || { bg: "#F1EFE8", text: "#444441" });
