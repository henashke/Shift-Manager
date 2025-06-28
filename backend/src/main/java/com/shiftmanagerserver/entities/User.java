package com.shiftmanagerserver.entities;

public class User {


    private String password;
    private String name;
    private int score;

    public User() {

    }

    public User(String name, int score, String konanId) {
        this();
        this.name = name;
        this.score = score;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getPassword() {

        return password;
    }

    public void setPassword(String hashedPassword) {
        this.password = hashedPassword;
    }
}