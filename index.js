const puppeteer = require('puppeteer');

async function selectStateAndGetCityOptions(page, state) {

    // Click on the state option
    await page.select('select[name="ctl00$innerPg$C009$DdlState"]', state);

    // Add a delay
    await page.waitForTimeout(500); // Adjust the delay as needed

    // Wait for the city select element to be ready
    await page.waitForSelector('select[name="ctl00$innerPg$C009$DdlCity"]');

    // Extract the values of all options within the updated city select element
    const cityOptions = await page.evaluate(() => {
        const citySelect = document.querySelector('select[name="ctl00$innerPg$C009$DdlCity"]');
        const optionElements = citySelect.querySelectorAll('option');

        return Array.from(optionElements, option => option.value);
    });

    return cityOptions;
}

async function selectCityAndGetHospitalDetails(page, city) {
    // Click on the city option
    await page.select('select[name="ctl00$innerPg$C009$DdlCity"]', city);

    // Add a delay
    await page.waitForTimeout(500); // Adjust the delay as needed

    // Wait for the table to be updated
    await page.waitForSelector('.table.blist.tblz01.rwd-table tbody tr');

    // Extract the hospital details from the table
    const hospitalDetails = await page.evaluate(() => {
        const rows = document.querySelectorAll('.table.blist.tblz01.rwd-table tbody tr');

        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td[data-th]');
            return {
                "Hospital Name": columns[1].textContent.trim(),
                "Address": columns[2].textContent.trim(),
                "City": columns[3].textContent.trim(),
                "State": columns[4].textContent.trim(),
                "ContactNo": columns[5].textContent.trim(),
                "Latitude": columns[6].textContent.trim(),
                "Longitude": columns[7].textContent.trim(),
            };
        });
    });

    return hospitalDetails;
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to the page
        await page.goto("https://www.icicilombard.com/cashless-hospitals");

        // Wait for the first select element to be present on the page
        await page.waitForSelector('select[name="ctl00$innerPg$C009$DdlState"]');

        // Extract the values of all options within the first select element
        const stateOptions = await page.evaluate(() => {
            const selectElement = document.querySelector('select[name="ctl00$innerPg$C009$DdlState"]');
            const optionElements = selectElement.querySelectorAll('option');

            return Array.from(optionElements, option => option.value);
        });

        console.log('State Options:', stateOptions);

        for (let i = 1; i < stateOptions.length; i++) { console.log('called',i)
            const cityOptions = await selectStateAndGetCityOptions(page, stateOptions[i]);
            console.log(`City Options for State ${stateOptions[i]}:`, cityOptions);

            for (let j = 1; j < cityOptions.length; j++) {
                const hospitalDetails = await selectCityAndGetHospitalDetails(page, cityOptions[j]);
                console.log(`Hospital Details for City ${cityOptions[j]}:`, hospitalDetails);
            }
        }

    } catch (error) {
        console.error("Error navigating to the page:", error);
    } finally {
        await browser.close();
    }
})();
