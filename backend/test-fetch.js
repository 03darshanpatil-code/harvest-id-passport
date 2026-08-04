const supabase = require("./config/supabase");

async function testInsert() {
  const { data, error } = await supabase
    .from("harvest")
    .insert([
      {
        farmer_name: "Darshan",
        crop_name: "Rice",
        location: "Bangalore",
        planting_date: "2026-08-01",
        harvest_date: "2026-11-15",
        status: "Growing"
      }
    ])
    .select();

  console.log("Data:", data);
  console.log("Error:", error);
}

testInsert();