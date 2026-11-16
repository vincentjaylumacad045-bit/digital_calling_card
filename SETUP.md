# Setup Guide: Digital Contact Card on Vercel

You need: a free GitHub account and a free Vercel account. No coding.

## Step 1 — Put the project on GitHub
1. Unzip `contact-card.zip` on your computer.
2. Go to https://github.com/new and create a new repository named `contact-card` (Private is fine).
3. Click **uploading an existing file**, drag in everything from the unzipped `contact-card` folder
   (`index.html`, `package.json`, the `api` folder, README and this guide), and click **Commit changes**.
   Make sure `index.html` and `package.json` are at the top level of the repo and the `api` folder sits next to them.

## Step 2 — Import it into Vercel
1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project**, pick the `contact-card` repository, and click **Import**.
3. Leave all settings as they are (Framework: Other) and click **Deploy**.
4. Wait about a minute. You now have a link like `https://contact-card-xxxx.vercel.app`.
   The card works, but you can't save changes yet. Continue with steps 3 and 4.

## Step 3 — Create the storage (where your edits and photos are saved)
1. In your Vercel project, open the **Storage** tab.
2. Click **Create Database → Blob** (or **Connect Store → Blob**), give it any name, and keep **Public** access.
3. Make sure it is **connected to your contact-card project** for all environments. Vercel adds the
   `BLOB_READ_WRITE_TOKEN` variable for you.

## Step 4 — Set your owner password
1. Go to **Settings → Environment Variables**.
2. Add a variable named `ADMIN_PASSWORD` and a strong password as the value. Apply it to Production, Preview and Development.
3. Click **Save**.

## Step 5 — Redeploy
Environment variables only apply to new deployments.
Go to **Deployments**, open the **⋯** menu on the latest one, and click **Redeploy**.

## Step 6 — Edit your card (owner only)
Visitors only see the card. They never see an edit button.
1. Open your secret edit link: `https://your-site.vercel.app/#edit`
2. Enter your `ADMIN_PASSWORD`. The editor opens, and this device now shows a ✎ button next to **Add to Contact**.
3. Change your text, upload your photo, pick colors and a font, and add social links. The card updates live as you type.
4. Press **Save changes**. Reload the site on another device to confirm.
5. On a shared computer, press **Lock editor on this device** when you are done.

## Step 7 (optional) — Your own domain
In Vercel go to **Settings → Domains**, add your domain, and follow the DNS instructions.
After that your edit link is `https://yourdomain.com/#edit` and your QR code uses the new address.

## Troubleshooting
- **"Wrong password"**: you haven't redeployed since adding `ADMIN_PASSWORD`, or you typed it differently. Redeploy and retry.
- **Saving or uploading fails**: the Blob store is not connected to the project. Repeat Step 3, then redeploy.
- **Edits don't show for visitors**: refresh the page. The card always loads the latest saved version.
- **Photo looks cropped**: use a portrait photo with your face in the upper half.
