# My Portfolio

This is a personal portfolio website built with [Zola](https://www.getzola.org/), a fast static site generator written in Rust.

## Prerequisites

To run this project locally, you will need to have Zola installed on your system. 
You can find the installation instructions for your specific operating system in the official [Zola documentation](https://www.getzola.org/documentation/getting-started/installation/).

## Running Locally

1. Open your terminal or command prompt.
2. Navigate to the root directory of this project.
3. Start the local development server by running the following command:

   ```bash
   zola serve
   ```

4. Once the server starts, open your web browser and navigate to the URL provided in the terminal (usually `http://127.0.0.1:1111`). 

The development server includes live-reloading, so any changes you make to the content or templates will automatically update in your browser.

## Building for Production

When you are ready to deploy your site, you can build the production-ready static files by running:

```bash
zola build
```

This command will generate a `public` directory containing your compiled website. You can then upload the contents of this folder to any static hosting service (like GitHub Pages, Netlify, Vercel, etc.).
