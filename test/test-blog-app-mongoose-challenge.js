'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);


function seedBlogPostData() {
    console.info('seeding BlogPost data');
    const seedData = [];

    for( let i = 1; i <= 10; i++){
        seedData.push(generateBlogPostData());
    }
    return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
    return {
        title: faker.lorem.sentence(),
        content: faker.lorem.sentence(),
        author: {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        }
    }
}

function tearDownDb(){
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('BlogPost API resource', function(){

    before(function(){
        return runServer(TEST_DATABASE_URL);
    });


    beforeEach(function(){
        return seedBlogPostData();
    });
    
    afterEach(function() {
        return tearDownDb();
    });
    after(function() {
        return closeServer();
    });

    describe('GET endpoint',function(){
        it('should return all existing blogposts', function(){

            let res;
            return chai.request(app)
              .get("/posts")
              .then(function(_res){
                  res = _res;
                  expect(res).to.have.status(200);
                  expect(res.body.blogposts).to.have.lengthOf.at.least(1);
                  return BlogPost
                    .countDocuments()
                    .then(function(count){
                        expect(res.body.blogposts).to.have.lengthOf(count);
                    });
              });
        });
    });

    describe("POST endpoint", function(){
        it('should post new data to the database', function(){

            const newBlogPost = generateBlogPostData();
            console.log(newBlogPost)
            
            return chai.request(app)
                .post('/posts')
                .send(newBlogPost)
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res).to.be.a('object');
                    expect(res.body).to.include.keys(
                        'id', 'title', 'content', 'author'
                    );
                    expect(res.body.title).to.equal(newBlogPost.title);
                    expect(res.body.content).to.equal(newBlogPost.content);

                    return BlogPost.findById(res.body.id);
                })
                .then(function(blogpost) {
                    expect(blogpost.title).to.equal(newBlogPost.title);
                    expect(blogpost.author.firstName).to.equal(newBlogPost.author.firstName);
                });
        });
    });

    describe("PUT endpoint", function(){
        it('should update new data', function(){
            const updateData = {
                title: "Brand New Title",
                content: "YOLO 24 hours 365 days",
                author: {
                    firstName: "Johnny",
                    lastName: "Bravo"
                }
            };
            return BlogPost
                .findOne()
                .then(function(blogpost) {
                    console.log(blogpost)
                    updateData.id = blogpost.id;
                return chai.request(app)
                    .put(`/posts/${updateData.id}`)
                    .send(updateData);
                })
                .then(function(res){
                    expect(res).to.have.status(204);
                    return BlogPost.findById(updateData.id);
                })
                .then(function(blogpost){
                    expect(blogpost.title).to.equal(updateData.title);
                });
        });
    });

    describe("Delete endpoint", function(){
        it('should delete data from the database', function(){
           let blogpost;
           
            return BlogPost
            .findOne()
            .then(function(_blogpost){
                blogpost = _blogpost;
                console.log("aAAAAAAHHHHH",blogpost);
                console.log("BAAAAAHHHHH", blogpost._id);
                return chai.request(app)
                    .delete(`/posts/${blogpost._id}`);
            })
            .then(function(res){
                expect(res).to.have.status(204);
                return BlogPost.findById(blogpost._id);
            })
            .then(function(_blogpost){
                expect(_blogpost).to.be.null;
            });
        });
    });





});

