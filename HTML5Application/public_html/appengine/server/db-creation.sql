/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
/**
 * Author:  davide
 * Created: Apr 19, 2017
 */

create database if not exists chip;

grant all on chip.* to 'chip-server'@'localhost' identified by 'caic89900e';

create table chip.soluzioni (
    id bigint(20) unsigned not null autoincrement,
    data datetime not null default current_timestamp,
    soluzione varchar(10000) not null,
    livello int not null,
    app int not null,
    session varchar(100) not null,
    risolto int(11) not null
);

alter table chip.soluzioni 
    add primary key (id), 
    add unique key id (id);

