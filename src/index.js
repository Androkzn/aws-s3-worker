
import { uploadFile, deleteFile, getObjectUrl, getObject } from '../s3.js';
import url from 'url';

export default {
  async fetch(request, env) {
    const urlNew = new URL(request.url)
    const key = urlNew.pathname.slice(1)
    const parsedUrl = url.parse(request.url, true); // Parse the URL including query parameters
    const { query } = parsedUrl;
    const type =  query.type || 'url';
    
		// Handle preflight requests (OPTIONS) for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400', // 24 hours
        },
      });
    }

    switch (request.method) {
        case 'POST':
          try {
            const formData = await request.formData();
            const imageFile = formData.get('image');
            const imageName = formData.get('name');
            const destination = formData.get('destination');

            // Use await to wait for the uploadFile function to complete
            await uploadFile(imageFile, imageName, 'image/jpeg', destination);
        
            // Respond with a success message or other appropriate response
            return new Response('File uploaded successfully', {
              status: 200,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
              },
            });
          } catch (error) {
            console.log('POST error: ', error);
        
            // Respond with an error message or other appropriate response
            return new Response('Error uploading file', {
              status: 400,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'text/plain',
              },
            });
          }
   
        case 'GET':
          try {
            if (type === 'object') {
              const object = await getObject(key);
              return new Response (object.Body, {
                status: 200,
                headers: {
                  'Access-Control-Allow-Origin': '*'
                }})
            } else if (type === 'url') {
              const url = await getObjectUrl(key);
              return new Response (url, {
                status: 200,
                headers: {
                  'Access-Control-Allow-Origin': '*'
                }})
            } else if (type === 'image') {
              const url = await getObjectUrl(key);
              const response = await fetch(url);
              return new Response (response, {
                status: 200,
                headers: {
                  'Access-Control-Allow-Origin': '*'
                }})
            } else {
              return new Response( 'Invalid type parameter', {
                status: 404,
                headers: {
                  'Access-Control-Allow-Origin': '*'
              }})
            }
    
          } catch (error) {
            return new Response( error, {
              status: 404,
              headers: {
                'Access-Control-Allow-Origin': '*'
            }})
          }
        case 'DELETE':
          try {
            const result = await deleteFile(key);
            return new Response(true, {
              status: 200,
              headers: {
                'Access-Control-Allow-Origin': '*'
              }})
            
          } catch (error) {
            return new Response(error,  {
              status: 200,
              headers: {
                'Access-Control-Allow-Origin': '*'
            }})
          } 
  
        default:
          return new Response('Method Not Allowed', {
            status: 405,
            headers: {
              Allow: 'PUT, POST, GET, DELETE, HEAD',
              'Access-Control-Allow-Origin': '*',  
            },
          });
      }
  },
};
 
