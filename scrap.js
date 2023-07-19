require('dotenv').config(); // Load environment variables from .env file

const axios = require('axios'); // Library for making HTTP requests
const cheerio = require('cheerio'); // Library for parsing and manipulating HTML
const { createClient } = require('@supabase/supabase-js'); // Library for interacting with Supabase

const url = 'https://www.suplementoscolombia.co/'; // URL of the website to be scraped
const supabaseUrl = process.env.SUPABASE_URL; // Supabase URL from environment variables
const supabaseKey = process.env.SUPABASE_KEY; // Supabase API key from environment variables

const supabase = createClient(supabaseUrl, supabaseKey, {
  persistSession: false, // Disable persistent sessions for Supabase client
});

// Function to fetch data from the website
async function fetchData() {
  const response = await axios.get(url); // Send GET request to the website
  const html = response.data; // Get the HTML content of the response
  const $ = cheerio.load(html); // Load the HTML into Cheerio for easy manipulation

  const linkslist = []; // Array to store the extracted links

  $('.submenu li a').each(function () {
    const link = $(this).attr('href'); // Extract the href attribute of each <a> element
    linkslist.push({ link: link }); // Push the link into the linkslist array
  });

  const linkslist2 = [];
  for (const element of linkslist) {
    const productUrl2 = element.link; // Extract the link from the object
    const productResponse2 = await axios.get(productUrl2); // Send GET request to the product URL
    const productHtml2 = productResponse2.data; // Get the HTML content of the response
    const product2$ = cheerio.load(productHtml2); // Load the HTML into Cheerio

    product2$('.page-link').each(function () {
      const link = $(this).attr('href'); // Extract the href attribute of each <a> element
      linkslist2.push({ link: link }); // Push the link into the linkslist2 array
    });
  }

  const filteredLinkslist2 = linkslist2.filter(item => item.link !== undefined); // Remove undefined links

  const linkslist3 = linkslist.concat(filteredLinkslist2); // Concatenate linkslist and filteredLinkslist2

  const productlist = []; // Array to store the extracted product information
const uniqueProducts = new Set(); // Set to store unique products (based on name, price, and productUrl3)

for (const element of linkslist3) {
  const productUrl = element.link; // Extract the link from the object
  const productResponse = await axios.get(productUrl); // Send GET request to the product URL
  const productHtml = productResponse.data; // Get the HTML content of the response
  const product$ = cheerio.load(productHtml); // Load the HTML into Cheerio

  product$('.grid_item').each(function () {
    const productUrl3 = $(this).find('a').attr('href'); // Extract the productUrl
    const name = product$(this).find('h3').text(); // Extract the product name
    const price = product$(this).find('span.new_price').text().replace('$', ''); // Extract the product price
    const productKey = name + price + productUrl3; // Create a unique key using the name, price, and productUrl3

    // Check if the product is already added to avoid duplicates
    if (!uniqueProducts.has(productKey)) {
      const productObj = {
        name: name,
        price: parseFloat(price),
        productUrl3: productUrl3 // Include the productUrl3 (productUrl) in the product object
      };

      productlist.push(productObj); // Push the product object into the productlist array
      uniqueProducts.add(productKey); // Add the product key to the uniqueProducts set to track duplicates
    }
  });
}


  console.log('Unique Products:', [...uniqueProducts]); // Log the unique products to the console

  return productlist; // Return the array of extracted product information
}

// Function to send data to Supabase
async function sendDataToSupabase() {
  try {
    const data = await fetchData(); // Fetch data from the website

    const { data: insertedData, error } = await supabase
      .from('Price')
      .insert(data); // Insert the data into the 'Price' table in Supabase

    if (error) {
      console.error('Error inserting data:', error);
    } else {
      console.log('Data inserted successfully:', insertedData);
    }
  } catch (error) {
    console.error('Error sending data to Supabase:', error);
  }
}



// Call the function to send data to Supabase
sendDataToSupabase();


