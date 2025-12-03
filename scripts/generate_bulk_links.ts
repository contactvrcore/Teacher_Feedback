import Papa from 'papaparse';
import fs from 'fs';
import { generateTrackingLinks } from '../lib/generateLink';

// Mock environment variables if running directly
if (!process.env.APP_HOST) process.env.APP_HOST = 'https://nps.vrcore.education';
if (!process.env.EMAIL_SIGNING_KEY) process.env.EMAIL_SIGNING_KEY = 'test-secret';

const USAGE = `
Usage: ts-node scripts/generate_bulk_links.ts <input_csv_file> [output_csv_file]

Input CSV format:
email,campaign,meta_key,meta_value
teacher@example.com,fall-2025,school,HighSchool1
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(USAGE);
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.csv', '_with_links.csv');

  try {
    const fileContent = fs.readFileSync(inputFile, 'utf-8');
    
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const outputRows = rows.map((row) => {
          const email = row.email || row.Email || row.teacherEmail;
          const campaign = row.campaign || row.Campaign || row.campaignId || 'default';
          
          if (!email) {
             console.warn('Skipping row missing email:', row);
             return null;
          }

          // Extract extra meta fields (everything that isn't email/campaign)
          const meta: Record<string, any> = { ...row };
          delete meta.email;
          delete meta.Email;
          delete meta.teacherEmail;
          delete meta.campaign;
          delete meta.Campaign;
          delete meta.campaignId;

          const links = generateTrackingLinks(email, campaign, meta);
          
          return {
            email,
            campaign,
            link_1: links[1],
            link_2: links[2],
            link_3: links[3],
            link_4: links[4],
            link_5: links[5],
            ...meta
          };
        }).filter(Boolean);

        const csv = Papa.unparse(outputRows);
        fs.writeFileSync(outputFile, csv);
        console.log(`Successfully generated links for ${outputRows.length} rows.`);
        console.log(`Output written to: ${outputFile}`);
      },
      error: (error: any) => {
        console.error('Error parsing CSV:', error);
      }
    });

  } catch (error) {
    console.error('Error reading file:', error);
    process.exit(1);
  }
}

main();

