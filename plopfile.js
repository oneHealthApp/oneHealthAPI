const path = require('path');

module.exports = function (plop) {
  plop.setGenerator('model', {
    description:
      'Generate a complete model with routes, service, controller, and repository',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Enter the model name (e.g., City OR Master/City):',
      },
    ],
    actions: function (data) {
      let actions = [];
      const path = require('path');
      // Split the name into folders
      const folders = data.name?.split('/');

      // Convert each folder to dash-case
      const dashCases = folders.map((str) => {
        // If the string contains a digit, return it unchanged
        if (/\d/.test(str)) {
          return str;
        }
        // Otherwise, convert to dash-case
        return str
          .replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`)
          .replace(/^-/, '');
      });

      // Determine last folder and full path
      const lastFolder = dashCases[dashCases.length - 1]; // Extract last folder name
      const fullPath = dashCases.join('/'); // Build full folder path

      // Calculate relative path depth from the file to "src/utils"
      const depth = dashCases.length + 1; // "+1" accounts for "src/modules"
      const relativePath = Array(depth).fill('..').join('/'); // Generate ../../../..

      // Attach the calculated properties to data
      data.lastFolder = lastFolder; // File name
      data.fullPath = fullPath; // Folder path for the module
      data.relativeUtils = path.posix.join(relativePath, 'utils'); // Relative path to utils
      data.relativeMiddleware = path.posix.join(relativePath, 'middlewares'); // Relative path to middlewares
      data.relativeCommon = path.posix.join(relativePath, 'common'); // Relative path to common

      // Add file creation actions
      actions.push(
        {
          type: 'add',
          path: `src/modules/${fullPath}/${lastFolder}.routes.ts`,
          templateFile: 'plop-templates/routes.hbs',
        },
        {
          type: 'add',
          path: `src/modules/${fullPath}/${lastFolder}.service.ts`,
          templateFile: 'plop-templates/service.hbs',
        },
        {
          type: 'add',
          path: `src/modules/${fullPath}/${lastFolder}.controller.ts`,
          templateFile: 'plop-templates/controller.hbs',
        },
        {
          type: 'add',
          path: `src/modules/${fullPath}/${lastFolder}.repository.ts`,
          templateFile: 'plop-templates/repository.hbs',
        },
        {
          type: 'add',
          path: `src/modules/${fullPath}/${lastFolder}.type.ts`,
          templateFile: 'plop-templates/type.hbs',
        },
        {
          type: 'add',
          path: `src/modules/${fullPath}/${lastFolder}.validator.ts`,
          templateFile: 'plop-templates/validator.hbs',
        },
      );

      // Ensure modules/index.ts exists
      actions.push({
        type: 'add',
        path: 'src/modules/index.ts',
        template: '// Auto-generated index file for modules\n',
        skipIfExists: true,
      });

      if (depth === 2) {
        // Top-level module (e.g., "City")
        actions.push({
          type: 'add',
          path: 'src/modules/index.ts',
          template: '// Auto-generated index file for modules\n',
          skipIfExists: true,
        });
        actions.push({
          type: 'append',
          unique: true,
          path: 'src/modules/index.ts',
          pattern: /$/g,
          template: `// ${lastFolder} routes\nexport { default as ${lastFolder}Routes } from "./${lastFolder}/${lastFolder}.routes";\n`,
        });
      } else if (depth > 2) {
        // Nested module (e.g., "Master/Canal")
        const parentFolder = dashCases[0];
        const subPath = dashCases.slice(1).join('/');

        // Create or update master/index.ts
        actions.push({
          type: 'add',
          path: `src/modules/${parentFolder}/index.ts`,
          template: `import { Router } from "express";\n\nconst ${parentFolder}Router = Router();\n\n// Add sub-routes here\n\nexport default ${parentFolder}Router;\n`,
          skipIfExists: true,
        });

        // Append import and use statement to master/index.ts
        actions.push({
          type: 'append',
          unique: true,
          path: `src/modules/${parentFolder}/index.ts`,
          pattern: /import { Router } from "express";/,
          template: `import ${lastFolder}Routes from "./${subPath}/${lastFolder}.routes";`,
        });
        actions.push({
          type: 'append',
          unique: true,
          path: `src/modules/${parentFolder}/index.ts`,
          pattern: /\/\/ Add sub-routes here/,
          template: `${parentFolder}Router.use("/${parentFolder}", ${lastFolder}Routes);`,
        });

        // Ensure modules/index.ts exists
        actions.push({
          type: 'add',
          path: 'src/modules/index.ts',
          template: '// Auto-generated index file for modules\n',
          skipIfExists: true,
        });

        // Append export for masterRouter to modules/index.ts
        actions.push({
          type: 'append',
          unique: true,
          path: 'src/modules/index.ts',
          pattern: /$/g,
          template: `// ${parentFolder} routes\nexport { default as ${parentFolder}Router } from "./${parentFolder}";\n`,
        });
      }
      return actions;
    },
  });
};

//       {
//         type: "append",
//         path: "./prisma/schema.prisma",
//         pattern: /$/g,
//         template: `
// model {{pascalCase name}} {
// id         Int        @id @default(autoincrement())

// createdAt  DateTime   @default(now())
// updatedAt  DateTime   @updatedAt
// }
// `,
//       },
