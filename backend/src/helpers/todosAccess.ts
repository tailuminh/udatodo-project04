import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('TodosAccess-DataLayer')

const attachmentBucket = new XAWS.S3({
    signatureVersion: "v4",
})

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const URLExpiration = process.env.S3_URL_EXPIRATION

// TODO: Implement the dataLayer logic
export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE) { }

    getTodos = async (userId: string): Promise<TodoItem[]> => {
        logger.log('info', 'Get todos for user: '.concat(userId))
        let todos: TodoItem[]
        const result = await this.docClient.query({
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()
        todos = result.Items as TodoItem[]
        return todos
    }

    createTodo = async (todo: TodoItem): Promise<TodoItem> => {
        logger.log('info', 'Create todo: '.concat(JSON.stringify(todo)))
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
        return todo
    }

    updateTodo = async (userId: string, todoId: string, updateTodo: UpdateTodoRequest): Promise<void> => {
        logger.log('info', 'Update todo: '.concat(JSON.stringify({ ...updateTodo, userId, todoId })))
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set #name=:name, dueDate=:dueDate, done=:done",
            ExpressionAttributeValues: {
                ":name": updateTodo.name,
                ":dueDate": updateTodo.dueDate,
                ":done": updateTodo.done
            },
            ExpressionAttributeNames: {
                "#name": "name"
            }
        }).promise()
    }

    deleteTodo = async (userId: string, todoId: string): Promise<void> => {
        logger.log('info', 'Delete todo: '.concat(todoId))
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            }
        }).promise()
    }

    generateUploadURL = async (userId: string, todoId: string): Promise<string> => {
        const url = await getS3SignedUrl()
        this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: "set attachmentUrl = :attachmentUrl",
            ExpressionAttributeValues: {
                ":attachmentUrl": url,
            }
        }, (err, data) => {
            if (err) {
                logger.log('error', JSON.stringify({
                    userId: userId,
                    todoId: todoId,
                    error: err
                }))
                throw new Error(err.message)
            }
            logger.log('info', JSON.stringify({
                userId: userId,
                todoId: todoId,
                payload: data
            }))
        })
        return url
    }
}

const getS3SignedUrl = async () => {
    const imageId = uuid.v4()
    const signedURL = await attachmentBucket.getSignedUrl("putObject", {
        Bucket: bucketName,
        Key: imageId,
        Expires: URLExpiration,
    });
    return signedURL;
}