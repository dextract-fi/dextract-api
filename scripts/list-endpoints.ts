import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const config = new DocumentBuilder()
    .setTitle('Dextract-fi API')
    .setDescription('The Dextract-fi API documentation')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  
  // Format the paths object for better readability
  const apiEndpoints = [];
  
  for (const [path, pathItem] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (method === 'parameters') continue;
      
      const endpoint = {
        path,
        method: method.toUpperCase(),
        summary: operation.summary || '',
        description: operation.description || '',
        parameters: [],
        requestBody: null,
        responses: {}
      };
      
      // Add parameters
      if (operation.parameters) {
        for (const param of operation.parameters) {
          endpoint.parameters.push({
            name: param.name,
            in: param.in,
            required: param.required,
            description: param.description,
            schema: param.schema
          });
        }
      }
      
      // Add request body
      if (operation.requestBody) {
        endpoint.requestBody = operation.requestBody;
      }
      
      // Add responses
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        endpoint.responses[statusCode] = response;
      }
      
      apiEndpoints.push(endpoint);
    }
  }
  
  // Create the output directory if it doesn't exist
  const outputDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write endpoints to a JSON file
  fs.writeFileSync(
    path.join(outputDir, 'api-endpoints.json'),
    JSON.stringify(apiEndpoints, null, 2)
  );
  
  // Write full OpenAPI spec
  fs.writeFileSync(
    path.join(outputDir, 'openapi-spec.json'),
    JSON.stringify(document, null, 2)
  );
  
  // Generate a Markdown documentation
  const markdownContent = generateMarkdownDocs(apiEndpoints, document.components);
  fs.writeFileSync(
    path.join(outputDir, 'api-docs.md'),
    markdownContent
  );
  
  console.log(`API documentation generated in ${outputDir}`);
  
  await app.close();
}

// Define types for OpenAPI objects
interface OpenAPIParameter {
  name: string;
  in: string;
  required: boolean;
  description?: string;
  schema: any;
}

interface OpenAPIRequestBody {
  content: {
    [contentType: string]: {
      schema: any;
    };
  };
}

interface OpenAPIResponse {
  description?: string;
  content?: {
    [contentType: string]: {
      schema: any;
    };
  };
}

interface OpenAPISchema {
  properties?: {
    [propertyName: string]: any;
  };
  required?: string[];
}

interface OpenAPIEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters: OpenAPIParameter[];
  requestBody: OpenAPIRequestBody | null;
  responses: {
    [statusCode: string]: OpenAPIResponse;
  };
}

// Helper function to generate Markdown documentation
function generateMarkdownDocs(endpoints: OpenAPIEndpoint[], components: any): string {
  let markdown = '# Dextract-fi API Documentation\n\n';
  
  // Group endpoints by first part of path (resource)
  const groupedEndpoints: { [resource: string]: OpenAPIEndpoint[] } = {};
  for (const endpoint of endpoints) {
    const resource = endpoint.path.split('/')[1];
    if (!groupedEndpoints[resource]) {
      groupedEndpoints[resource] = [];
    }
    groupedEndpoints[resource].push(endpoint);
  }
  
  // Generate TOC
  markdown += '## Table of Contents\n\n';
  for (const resource of Object.keys(groupedEndpoints).sort()) {
    markdown += `- [${resource}](#${resource})\n`;
  }
  markdown += '\n';
  
  // Generate endpoint documentation
  for (const resource of Object.keys(groupedEndpoints).sort()) {
    markdown += `## ${resource}\n\n`;
    
    for (const endpoint of groupedEndpoints[resource]) {
      markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
      
      if (endpoint.summary) {
        markdown += `**Summary:** ${endpoint.summary}\n\n`;
      }
      
      if (endpoint.description) {
        markdown += `**Description:** ${endpoint.description}\n\n`;
      }
      
      // Parameters
      if (endpoint.parameters.length > 0) {
        markdown += '#### Parameters\n\n';
        markdown += '| Name | Located in | Required | Description | Schema |\n';
        markdown += '| ---- | ---------- | -------- | ----------- | ------ |\n';
        
        for (const param of endpoint.parameters) {
          const schemaType = getSchemaType(param.schema);
          markdown += `| ${param.name} | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.description || ''} | ${schemaType} |\n`;
        }
        markdown += '\n';
      }
      
      // Request body
      if (endpoint.requestBody) {
        markdown += '#### Request Body\n\n';
        const content = endpoint.requestBody.content;
        const contentType = Object.keys(content)[0];
        const schema = content[contentType].schema;
        
        if (schema.$ref) {
          const modelName = schema.$ref.split('/').pop();
          markdown += `**Content Type:** ${contentType}\n\n`;
          markdown += `**Schema:** [${modelName}](#${modelName.toLowerCase()})\n\n`;
        } else {
          markdown += `**Content Type:** ${contentType}\n\n`;
          markdown += '```json\n';
          markdown += JSON.stringify(schema, null, 2);
          markdown += '\n```\n\n';
        }
      }
      
      // Responses
      markdown += '#### Responses\n\n';
      markdown += '| Status Code | Description | Schema |\n';
      markdown += '| ----------- | ----------- | ------ |\n';
      
      for (const [statusCode, response] of Object.entries(endpoint.responses)) {
        let schemaType = 'N/A';
        
        if (response.content) {
          const contentType = Object.keys(response.content)[0];
          const schema = response.content[contentType].schema;
          
          if (schema) {
            if (schema.$ref) {
              const modelName = schema.$ref.split('/').pop();
              schemaType = `[${modelName}](#${modelName.toLowerCase()})`;
            } else if (schema.type) {
              schemaType = getSchemaType(schema);
            }
          }
        }
        
        markdown += `| ${statusCode} | ${response.description || ''} | ${schemaType} |\n`;
      }
      
      markdown += '\n';
    }
  }
  
  // Generate schema documentation
  if (components && components.schemas) {
    markdown += '## Schemas\n\n';
    
    for (const [name, schema] of Object.entries(components.schemas)) {
      markdown += `### ${name}\n\n`;
      
      // Type assertion for schema
      const typedSchema = schema as OpenAPISchema;
      
      if (typedSchema.properties) {
        markdown += '| Property | Type | Required | Description |\n';
        markdown += '| -------- | ---- | -------- | ----------- |\n';
        
        const requiredProps = typedSchema.required || [];
        
        for (const [propName, propSchema] of Object.entries(typedSchema.properties)) {
          const type = getSchemaType(propSchema);
          const isRequired = requiredProps.includes(propName);
          markdown += `| ${propName} | ${type} | ${isRequired ? 'Yes' : 'No'} | ${propSchema.description || ''} |\n`;
        }
      }
      
      markdown += '\n';
    }
  }
  
  return markdown;
}

// Helper function to get schema type
function getSchemaType(schema: any): string {
  if (!schema) return 'N/A';
  
  if (schema.$ref) {
    const modelName = schema.$ref.split('/').pop();
    return `[${modelName}](#${modelName.toLowerCase()})`;
  }
  
  if (schema.type === 'array' && schema.items) {
    if (schema.items.$ref) {
      const modelName = schema.items.$ref.split('/').pop();
      return `Array<[${modelName}](#${modelName.toLowerCase()})>`;
    }
    return `Array<${schema.items.type || 'object'}>`;
  }
  
  return schema.type || 'object';
}

bootstrap();