import { Router, type Request, type Response } from "express";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
import { checkRoleStudent } from "../middlewares/checkRoleStudentMiddleware.js";
import { reset_enrollments, students } from "../db/db.js";
import { check, success } from "zod";
import { checkRole } from "../middlewares/checkRoleMiddleware.js";
import type { CustomRequest } from "../libs/types.js";

const router = Router();

router.get("/",authenticateToken,checkRoleAdmin,(req:Request,res:Response)=>{
    return res.status(200).json({
        success:true,
        message:"Enrollments Information",
        data: students.map(
            (student)=>{
                return {
                    student: student.studentId,
                    courses: student.courses==null? []:student.courses.map(
                        (id)=>{
                            return {
                                courseId: id
                            }
                        }
                    )
                }
            }
        )
    })
})

router.post("/reset",authenticateToken,checkRoleAdmin,(req:Request,res:Response)=>{
    try{
        reset_enrollments();
        return res.status(200).json({
            success:true,
            message: "enrollments database has been reset"
        })
    }catch(err){
        return res.status(500).json({
        success: false,
        message: "Something is wrong, please try again",
        error: err,
    });
    }
})

router.get("/:studentId",authenticateToken,checkRole,(req:CustomRequest,res:Response)=>{
    try{
        const role = req.user?.role;
        if(role==="ADMIN"){
            return res.status(200).json({
                success:true,
                message:"Student Information",
                data: students.find((student)=>{
                    return student.studentId === req.params.studentId
                })
            })
        }
        if(role==="STUDENT" && req.params.studentId === req.user?.studentId){
            return res.status(200).json({
                success:true,
                message:"Student Information",
                data: students.find((student)=>{
                    return student.studentId === req.params.studentId
                })
            }) 
        }
        return res.status(403).json({
            success: false,
            message:"Forbidden access"
        })

    }catch(err){
        return res.status(500).json({ 
            success: false,
            message: "Something is wrong, please try again",
            error: err,
    });   
    }
})

router.post("/:studentId",authenticateToken,checkRoleStudent,(req:CustomRequest,res:Response)=>{
    try{
        if(req.user?.studentId===req.params.studentId){
            const foundIndex = students.findIndex((std)=>{
                return std.studentId===req.params.studentId
            })
            const courseFound = students[foundIndex]?.courses?.find((course)=>{
                return course === req.body.courseId
            })
            if(courseFound){
                return res.status(409).json({
                    success:false,
                    message:"StudentId && CourseId is already exists"
                })
            }
            if (students[foundIndex] && !students[foundIndex].courses) {
                students[foundIndex].courses = [];
                }
            students[foundIndex]?.courses?.push(req.body.courseId);
            return res.status(200).json({
                success:true,
                message: `Student ${req.params.studentId} && Course ${req.body.courseId} has been added successfully.`,
                data: {
                    studentId: req.body.studentId,
                    courseId: req.body.courseId
                }   
            })
        }
        return res.status(403).json({
            success:false,
            message:"Forbidden access"
        })

    }catch(err){
        return res.status(500).json({ 
            success: false,
            message: "Something is wrong, please try again",
            error: err,
    }); 
    }
})


router.delete("/:studentId",authenticateToken,checkRoleStudent,(req:CustomRequest,res:Response)=>{
    try{
        if(req.user?.studentId===req.params.studentId){
            const studentIndex = students.findIndex((std)=> std.studentId===req.user?.studentId)
            const courseIndex = students[studentIndex]?.courses?.findIndex((course)=>course===req.body.courseId)
            if(courseIndex===-1){
                return res.status(404).json({
                    success:false,
                    message:"Enrollment does not exists"
                })
            }
            if(courseIndex){
                students[studentIndex]?.courses?.splice(courseIndex,1)
                return res.status(200).json({
                    success:true,
                    message:`Student ${req.body.studentId} && Course ${req.body.courseId} has been deleted successfully.`
                })
            }
        }

        return res.status(403).json({
            success:false,
            message:"You are not allowed to modify another student's data"
        })

    }catch(err){
        return res.status(500).json({ 
            success: false,
            message: "Something is wrong, please try again",
            error: err,
    }); 
    }
})

export default router;