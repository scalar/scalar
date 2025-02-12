import { Storage } from '@google-cloud/storage'

// Function to download the GCP file to memory
export const downloadFileToMemory = async (
  bucketName: string,
  fileName: string,
) => {
  // Create a client
  const storage = new Storage()
  try {
    // Get the file from the bucket
    const file = storage.bucket(bucketName).file(fileName)

    // Download the file to a buffer
    const [fileBuffer] = await file.download()

    // File is now available in memory as a Buffer
    return fileBuffer.toString()
    // You can now manipulate the fileBuffer as needed
  } catch (error) {
    console.error('Error downloading the file:', error)
  }

  return ''
}

export const downloadFile = async (
  bucketName: string,
  fileName: string,
  destFileName: string,
) => {
  // Create a client
  const storage = new Storage()
  try {
    // Download the file
    await storage
      .bucket(bucketName)
      .file(fileName)
      .download({ destination: destFileName })

    console.log(`File ${fileName} downloaded to ${destFileName} successfully!`)
  } catch (error) {
    console.error('Error downloading the file:', error)
  }
}
