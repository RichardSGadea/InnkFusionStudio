import { Request, Response } from "express";
import { User } from "../models/User";
import { UserRoles } from "../constants/UserRoles";
import { Portfolio } from "../models/Portfolio";
import { Appointment } from "../models/Appointment";
import { AppointmentPortfolio } from "../models/AppointmentPortfolio";
import { error, log } from "console";


export const appointmentController = {

    async create(req: Request, res: Response): Promise<void> {
        try {
            const userId = Number(req.tokenData.userId);

            const { appointment_date, email, name } = req.body;

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate() + 1;
            const todayDate = new Date(year, month - 1, day);
            const appointment = new Date(appointment_date);

            //To validate the format of date and email
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

            const user = await User.findOne({
                where: {
                    id: userId,
                }
            })

            if (!user) {
                res.status(404).json({ message: "Restart Login, invalid token provided" });
                return;
            }


            if (appointment < todayDate) {
                res.status(400).json({
                    message: 'This day is prior to the current day, try again.'
                });
                return;
            }

            if (!appointment_date || typeof appointment_date !== "string" || !dateRegex.test(appointment_date)) {
                res.status(400).json({

                    message: 'Remember you must insert a date, and the date format should be YYYY-MM-DD, try again'
                });
                return;
            }

            if (typeof email !== "string" || email.length > 120 || !emailRegex.test(email)) {
                res.status(400).json({
                    message: 'Invalid or too long email'
                });
                return;
            }


            //Verify email 

            const foundWorkerByEmail = await User.findOne({
                where: { email: email, role: UserRoles.WORKER },
            });

            if (!foundWorkerByEmail) {
                res.status(404).json({ message: "Worker not found" });
                return;
            }


            //Verify service

            const getService = await Portfolio.findOne({
                where: { name: name }
            });

            if (!getService) {
                res.status(404).json({ message: "Service not found in Portfolio" });
                return;
            }

            //Verify the non-existence of the appointment


            const existingAppointment = await Appointment.findOne({
                where: {
                    appointmentDate:appointment,
                    workerId: foundWorkerByEmail.id,
                }
            });

            if (existingAppointment) {
                res.status(400).json({
                    message: 'Appointment is not available',
                    
                });
                return;
            }

            const createAppointment = await Appointment.create({
                appointmentDate: appointment,
                workerId: foundWorkerByEmail.id,
                clientId: userId,
            }).save();

            await AppointmentPortfolio.create({
                appointmentId: createAppointment.id,
                portfolioId: getService.id,
            }).save();

            res.status(201).json({
                message: "Appointment has been created",
                user:user
            })

        } catch (error) {
            res.status(500).json({
                message: "Failed to create appointment"
            })
        }
    },

    async update(req: Request, res: Response): Promise<void> {

        try {
            
            const userId = Number(req.tokenData.userId);

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            const day = today.getDate() + 1;
            const todayDate = new Date(year, month-1, day);

            const { AppointmentDate } = req.body;
            const newDate = new Date(AppointmentDate)

            const user = await User.findOne({
                where: {
                    id: userId,
                }
            })

            if (!user) {
                res.status(404).json({ message: "Restart Login, invalid token provided" });
                return;
            }

            const appointmentId = Number(req.params.id)

            const appointmentToUpdate = await Appointment.findOne({
                where: {
                    id: appointmentId,
                    clientId: userId
                }
            })

            if (!appointmentToUpdate) {
                res.status(404).json({
                    message: "Appointment not found"
                })
                return;
            }

            if (!AppointmentDate) {
                res.status(400).json({
                    message: "All fields must be provided",
                });
                return;
            }

            if (newDate < todayDate) {
                res.status(400).json({
                    message: 'This day is prior to the current day, try again.'
                });
                return;
            }
                
            appointmentToUpdate.appointmentDate = newDate;
            appointmentToUpdate.updatedAt = todayDate;
            
            await Appointment.save(appointmentToUpdate)

            res.status(202).json({
                message: "Appointment updated successfully"
            })

        } catch (error) {
            res.status(500).json({
                message: "Failed to update appointment",
            });
        }
    },

    async delete(req: Request, res: Response): Promise<void> {
        try {

        } catch (error) {
            res.status(500).json({
                message: "Failed to delete appointment"
            })
        }
    },

    async getOfClient(req: Request, res: Response): Promise<void> {
        try {

        } catch (error) {
            res.status(500).json({
                message: "Failed to retrieve appointments"
            })
        }
    },

    async getOfWorker(req: Request, res: Response): Promise<void> {
        try {

        } catch (error) {
            res.status(500).json({
                message: "Failed to retrieve appointments",
            })
        }
    },


}